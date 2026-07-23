import { supabase } from "../../lib/supabase";
import { uploadAssetPhoto } from "./tools";

export async function getDamageReports({ setMessage, setDamageReports }) {
  const { data, error } = await supabase
    .from("damage_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setMessage(error.message);
    return;
  }

  setDamageReports(data || []);
}

export function resetDamageForm(setDamageForm) {
  setDamageForm({
    title: "",
    description: "",
    severity: "medium",
    report_type: "damage",
    photoFile: null,
  });
}

export async function handleReportDamage({
  e,
  session,
  selectedDamageTool,
  damageForm,
  setMessage,
  resetDamageFormFn,
  setSelectedDamageTool,
  getToolsFn,
  getActivityFn,
  getDamageReportsFn,
  logActivityFn,
}) {
  e.preventDefault();

  if (!session?.user?.id) {
    setMessage("You must be signed in to submit a damage report.");
    return;
  }

  if (!selectedDamageTool) {
    setMessage("Select an asset before submitting a damage report.");
    return;
  }

  if (!damageForm.title.trim() || !damageForm.description.trim()) {
    setMessage("Damage title and description are required.");
    return;
  }

  setMessage("");

  let uploadedPhotoUrl = null;

  try {
    if (damageForm.photoFile) {
      const upload = await uploadAssetPhoto({
        file: damageForm.photoFile,
        toolId: selectedDamageTool.id,
        folder: "reports",
      });
      uploadedPhotoUrl = upload?.publicUrl ?? null;
    }

    const { error: reportError } = await supabase
      .from("damage_reports")
      .insert({
        tool_id: selectedDamageTool.id,
        reported_by: session.user.id,
        report_type: damageForm.report_type,
        title: damageForm.title.trim(),
        description: damageForm.description.trim(),
        severity: damageForm.severity,
        status: "reported",
        photo_url: uploadedPhotoUrl,
      });

    if (reportError) {
      setMessage(reportError.message);
      return;
    }

    const { error: toolDamageError } = await supabase
      .from("tools")
      .update({
        is_damaged: true,
        damage_status: "reported",
      })
      .eq("id", selectedDamageTool.id);

    if (toolDamageError) {
      setMessage(
        `Report saved, but tool update failed: ${toolDamageError.message}`,
      );
      return;
    }

    await logActivityFn({
      toolId: selectedDamageTool.id,
      action: "damage_reported",
      details:
        "{actor} reported " +
        damageForm.report_type +
        " on " +
        (selectedDamageTool.name || "an asset"),
    });

    resetDamageFormFn();
    setSelectedDamageTool(null);
    setMessage("Damage report submitted.");

    await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
  } catch (error) {
    setMessage(error.message);
  }
}

export async function handleResolveDamageReport({
  isAdmin,
  report,
  session,
  setMessage,
  logActivityFn,
  getToolsFn,
  getActivityFn,
  getDamageReportsFn,
}) {
  if (!isAdmin) return;

  const { error: reportError } = await supabase
    .from("damage_reports")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: session.user.id,
    })
    .eq("id", report.id);

  if (reportError) {
    setMessage(reportError.message);
    return;
  }

  const { data: unresolvedRows } = await supabase
    .from("damage_reports")
    .select("id")
    .eq("tool_id", report.tool_id)
    .neq("status", "resolved");

  const hasOpenItems = (unresolvedRows || []).length > 0;

  await supabase
    .from("tools")
    .update({
      is_damaged: hasOpenItems,
      damage_status: hasOpenItems ? "reported" : "resolved",
    })
    .eq("id", report.tool_id);

  await logActivityFn({
    toolId: report.tool_id,
    action: "damage_resolved",
    details: "{actor} resolved a damage report",
  });

  setMessage("Damage report resolved.");
  await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
}

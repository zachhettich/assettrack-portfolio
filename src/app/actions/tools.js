import { supabase } from "../../lib/supabase";

export async function getTools({ setMessage, setTools, sortBy = "id" } = {}) {
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .order(sortBy, { ascending: true });

  if (error) {
    setMessage?.(error.message);
    return;
  }

  setTools?.(data || []);
}

export async function handleAddTool({
  e,
  newTool,
  session,
  setMessage,
  setNewTool,

  getToolsFn,
  getActivityFn,
  getDamageReportsFn,
  uploadAssetPhotoFn,
  logActivityFn,
}) {
  e.preventDefault();
  setMessage("");

  if (!newTool.name.trim()) {
    setMessage("Asset name is required.");
    return;
  }

  const payload = {
    name: newTool.name.trim(),
    category: newTool.category.trim(),
    asset_tag: newTool.asset_tag.trim(),
    status: "available",
    condition: newTool.condition || "good",
    location: newTool.location.trim(),
    notes: newTool.notes.trim(),
    checked_out_by: null,
    asset_type: newTool.asset_type || "tool",
    make: newTool.asset_type === "vehicle" ? newTool.make.trim() : null,
    model: newTool.asset_type === "vehicle" ? newTool.model.trim() : null,
    year:
      newTool.asset_type === "vehicle" && newTool.year
        ? Number(newTool.year)
        : null,
    license_plate:
      newTool.asset_type === "vehicle" ? newTool.license_plate.trim() : null,
    vin: newTool.asset_type === "vehicle" ? newTool.vin.trim() : null,
    odometer:
      newTool.asset_type === "vehicle" && newTool.odometer
        ? Number(newTool.odometer)
        : null,
    is_damaged: false,
    damage_status: "none",
  };

  const { data, error } = await supabase
    .from("tools")
    .insert(payload)
    .select()
    .single();

  if (error) {
    setMessage(error.message);
    return;
  }

  try {
    if (newTool.photoFile) {
      const upload = await uploadAssetPhotoFn(
        newTool.photoFile,
        data.id,
        data.asset_type === "vehicle" ? "vehicles" : "tools",
      );

      if (upload) {
        await supabase.from("asset_photos").insert({
          tool_id: data.id,
          file_path: upload.filePath,
          public_url: upload.publicUrl,
          caption: `${data.name} primary photo`,
          uploaded_by: session.user.id,
        });

        await supabase
          .from("tools")
          .update({ primary_photo_url: upload.publicUrl })
          .eq("id", data.id);
      }
    }

    await logActivityFn({
      toolId: data.id,
      action: "asset_added",
      details:
        "{actor} added " +
        (data.asset_type === "vehicle" ? "vehicle " : "tool ") +
        data.name +
        (data.location ? ` to ${data.location}` : ""),
    });

    setNewTool({
      name: "",
      category: "",
      asset_tag: "",
      condition: "",
      location: "",
      notes: "",
      asset_type: "tool",
      make: "",
      model: "",
      year: "",
      license_plate: "",
      vin: "",
      odometer: "",
      photoFile: null,
    });

    setMessage("Asset added successfully.");
    await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
  } catch (uploadError) {
    setMessage(`Asset added, but photo upload failed: ${uploadError.message}`);
    await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
  }
}

export async function handleDeleteTool({
  tool,
  setMessage,
  logActivityFn,
  getToolsFn,
  getActivityFn,
  getDamageReportsFn,
}) {
  const confirmed = window.confirm(
    `Delete ${tool.name}? This cannot be undone.`,
  );
  if (!confirmed) return;

  setMessage("");

  const { error } = await supabase.from("tools").delete().eq("id", tool.id);

  if (error) {
    setMessage(error.message);
    return;
  }

  await logActivityFn({
    toolId: tool.id,
    action: "tool_deleted",
    details:
      "{actor} removed " +
      (tool.name || "an asset") +
      (tool.location ? ` from ${tool.location}` : ""),
  });

  setMessage(`${tool.name} deleted successfully.`);
  await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
}

export async function handleCheckout({
  tool,
  session,
  setMessage,
  logActivityFn,
  getToolsFn,
  getActivityFn,
  getDamageReportsFn,
}) {
  if (!session?.user?.email || !session?.user?.id) return;
  setMessage("");

  if (tool.status === "checked_out") {
    setMessage(
      tool.checked_out_by === session.user.email
        ? `You already have ${tool.name} checked out.`
        : `${tool.name} is already checked out by ${tool.checked_out_by}.`,
    );
    return;
  }

  // Avoid duplicate open checkouts
  const { data: existingCheckout, error: existingCheckoutError } =
    await supabase
      .from("checkouts")
      .select("id")
      .eq("tool_id", tool.id)
      .is("checked_in_at", null)
      .limit(1)
      .maybeSingle();

  if (existingCheckoutError) {
    setMessage(existingCheckoutError.message);
    console.error(
      "handleCheckout: existingCheckout lookup failed",
      existingCheckoutError,
    );
    return;
  }

  if (existingCheckout) {
    setMessage(
      `${tool.name} already has an open checkout record. Please check in the current checkout first.`,
    );
    return;
  }

  // Keep current update conditions and require the updated tool
  const { data: updatedTool, error: toolError } = await supabase
    .from("tools")
    .update({
      status: "checked_out",
      checked_out_by: session.user.email,
    })
    .eq("id", tool.id)
    .neq("status", "checked_out")
    .select()
    .single();

  if (toolError) {
    setMessage(toolError.message);
    console.error("handleCheckout: tools update failed", toolError);
    return;
  }

  if (!updatedTool) {
    setMessage(
      `Unable to check out ${tool.name}. It may have been updated by another user.`,
    );
    console.error("handleCheckout: tools update returned no updatedTool");
    return;
  }

  // Only create the checkout after the tools row is confirmed updated
  const { error: checkoutError } = await supabase.from("checkouts").insert({
    tool_id: tool.id,
    user_email: session.user.email,
    user_id: session.user.id,
    notes: `${tool.name} checked out`,
  });

  if (checkoutError) {
    setMessage(checkoutError.message);
    console.error("handleCheckout: checkouts insert failed", checkoutError);
    return;
  }

  await logActivityFn({
    toolId: tool.id,
    action: "checkout",
    details:
      "{actor} accessed " +
      (tool.location || "the tool area") +
      " for " +
      (tool.name || "an asset"),
  });

  setMessage(`${tool.name} checked out successfully.`);
  await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
}

export async function handleCheckIn({
  tool,
  session,
  setMessage,
  logActivityFn,
  getToolsFn,
  getActivityFn,
  getDamageReportsFn,
}) {
  setMessage("");

  if (tool.status !== "checked_out") {
    setMessage(`${tool.name} is already available.`);
    return;
  }

  if (tool.checked_out_by !== session?.user?.email) {
    setMessage(
      `You cannot check in ${tool.name} because it is assigned to ${tool.checked_out_by}.`,
    );
    return;
  }

  const { data: openCheckout, error: checkoutFindError } = await supabase
    .from("checkouts")
    .select("*")
    .eq("tool_id", tool.id)
    .is("checked_in_at", null)
    .order("checked_out_at", { ascending: false })
    .limit(1);

  if (checkoutFindError) {
    setMessage(checkoutFindError.message);
    return;
  }

  if (!openCheckout || openCheckout.length === 0) {
    setMessage("No open checkout record found for this tool.");
    return;
  }

  const checkoutRow = openCheckout[0];

  if (checkoutRow.user_email !== session?.user?.email) {
    setMessage(
      `You cannot check in ${tool.name} because it was checked out by ${checkoutRow.user_email}.`,
    );
    return;
  }

  // First update tools, then close the checkout record, then log activity
  const { data: updatedTool, error: toolUpdateError } = await supabase
    .from("tools")
    .update({
      status: "available",
      checked_out_by: null,
    })
    .eq("id", tool.id)
    .eq("checked_out_by", session.user.email)
    .select()
    .single();

  if (toolUpdateError) {
    setMessage(toolUpdateError.message);
    console.error("handleCheckIn: tools update failed", toolUpdateError);
    return;
  }

  if (!updatedTool) {
    const msg = `${tool.name} could not be checked in because its checkout assignment changed.`;
    setMessage(msg);
    console.error("handleCheckIn: tools update returned no updatedTool");
    return;
  }

  const { error: checkoutUpdateError } = await supabase
    .from("checkouts")
    .update({
      checked_in_at: new Date().toISOString(),
      notes: `${tool.name} checked in`,
    })
    .eq("id", checkoutRow.id);

  if (checkoutUpdateError) {
    setMessage(checkoutUpdateError.message);
    console.error(
      "handleCheckIn: checkouts update failed",
      checkoutUpdateError,
    );
    return;
  }

  await logActivityFn({
    toolId: tool.id,
    action: "checkin",
    details:
      "{actor} returned " +
      (tool.name || "an asset") +
      (tool.location ? ` to ${tool.location}` : ""),
  });

  setMessage(`${tool.name} checked in successfully.`);
  await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
}

export async function uploadAssetPhoto({ file, toolId, folder = "assets" }) {
  if (!file || !toolId) return null;

  const extension = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const filePath = `${folder}/${toolId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("asset-photos")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("asset-photos").getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: data.publicUrl,
  };
}

export async function handleUploadPhotoForTool({
  tool,
  isAdmin,
  photoFilesByToolId,
  setMessage,
  setPhotoFilesByToolId,
  session,
  logActivityFn,
  getToolsFn,
  getActivityFn,
  getDamageReportsFn,
}) {
  if (!isAdmin) return;

  const file = photoFilesByToolId[tool.id];
  if (!file) {
    setMessage("Choose an image first.");
    return;
  }

  const folder = tool.asset_type === "vehicle" ? "vehicles" : "tools";
  const upload = await uploadAssetPhoto({ file, toolId: tool.id, folder });

  await supabase.from("asset_photos").insert({
    tool_id: tool.id,
    file_path: upload.filePath,
    public_url: upload.publicUrl,
    caption: `${tool.name} uploaded photo`,
    uploaded_by: session.user.id,
  });

  await supabase
    .from("tools")
    .update({ primary_photo_url: upload.publicUrl })
    .eq("id", tool.id);

  await logActivityFn({
    toolId: tool.id,
    action: "photo_uploaded",
    details: "{actor} uploaded a photo for " + (tool.name || "an asset"),
  });

  setPhotoFilesByToolId((prev) => ({ ...prev, [tool.id]: null }));
  setMessage("Photo uploaded successfully.");
  await Promise.all([getToolsFn(), getActivityFn(), getDamageReportsFn()]);
}

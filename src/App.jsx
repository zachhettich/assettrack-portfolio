/*
  App.jsx
  ---------------------------------------
  Main app controller and layout shell.

  This file controls:
  - Supabase auth session setup and profile loading
  - Global app state
  - Asset, activity, and damage-report data fetching
  - Main action handlers:
    - sign in / sign up / sign out
    - add asset
    - delete asset
    - check out / check in
    - report damage / resolve damage
    - upload asset photos
    - delete account profile
  - Shared computed values and filters
  - Active page switching/navigation
  - Top-level layout:
    - sidebar
    - topbar
    - content area
  - Decides which page component to render
*/

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";
// Logo images replaced with text-only branding for public demo
import renderDashboardPage from "./app/pages/renderDashboardPage";
import renderInventoryPage from "./app/pages/renderInventoryPage";
import renderCheckoutPage from "./app/pages/renderCheckoutPage";
import renderDamagePage from "./app/pages/renderDamagePage";
import renderActivityPage from "./app/pages/renderActivityPage";
import renderAccountPage from "./app/pages/renderAccountPage";
import renderAdminPage from "./app/pages/renderAdminPage";
import renderVehiclesPage from "./app/pages/renderVehiclesPage";
import {
  getVehicleFuelLogs,
  getVehicleMaintenanceLogs,
  addVehicleFuelLog,
  addVehicleMaintenanceLog,
  updateVehicleOdometerIfHigher,
} from "./app/actions/vehicles";

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tools, setTools] = useState([]);
  const [activity, setActivity] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");
  const [authMode, setAuthMode] = useState("signin");

  const [inventorySearch, setInventorySearch] = useState("");
  const [checkoutSearch, setCheckoutSearch] = useState("");
  const [damageSearch, setDamageSearch] = useState("");

  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState("");
  const [inventoryLocationFilter, setInventoryLocationFilter] = useState("");
  const [inventoryAssetTypeFilter, setInventoryAssetTypeFilter] = useState("");
  const [inventoryDamageFilter, setInventoryDamageFilter] = useState("");

  const [checkoutCategoryFilter, setCheckoutCategoryFilter] = useState("");
  const [checkoutStatusFilter, setCheckoutStatusFilter] = useState("");
  const [checkoutLocationFilter, setCheckoutLocationFilter] = useState("");
  const [checkoutMineOnly, setCheckoutMineOnly] = useState(false);

  const [companyUpdates, setCompanyUpdates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [companyForms, setCompanyForms] = useState([]);
  const [formAssignments, setFormAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const isAdmin = profile?.role === "admin";

  const [updateForm, setUpdateForm] = useState({
    id: null,
    title: "",
    body: "",
    is_published: true,
    is_pinned: false,
  });

  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    target_mode: "all", // all | role | user
    target_role: "employee",
    target_user_id: "",
  });

  const [companyFormForm, setCompanyFormForm] = useState({
    id: null,
    title: "",
    description: "",
    category: "general",
    link_url: "",
    file_url: "",
    is_active: true,
  });

  const [assignmentForm, setAssignmentForm] = useState({
    form_id: "",
    user_id: "",
    due_date: "",
    notes: "",
  });

  const [newTool, setNewTool] = useState({
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

  const [selectedDamageTool, setSelectedDamageTool] = useState(null);
  const [damageForm, setDamageForm] = useState({
    title: "",
    description: "",
    severity: "medium",
    report_type: "damage",
    photoFile: null,
  });

  const [vehicleFuelLogs, setVehicleFuelLogs] = useState([]);
  const [vehicleMaintenanceLogs, setVehicleMaintenanceLogs] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [fuelForm, setFuelForm] = useState({
    toolid: "",
    entry_date: "",
    driver_name: "",
    odometer_km: "",
    fuel_type: "Clear Diesel",
    pump_start: "",
    pump_end: "",
    notes: "",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    toolid: "",
    service_date: "",
    odometer_km: "",
    service_type: "",
    description: "",
    vendor: "",
    cost: "",
    next_service_due_date: "",
    next_service_due_km: "",
    notes: "",
  });

  useEffect(() => {
    if (!session?.user) return;

    if (activePage === "damage" || activePage === "admin") {
      getDamageReports();
    }
  }, [activePage, session]);

  useEffect(() => {
    if (!session?.user) return;

    // Route guard: employees attempting admin-only pages are redirected to dashboard.
    // Must not block "vehicles".
    if (!isAdmin) {
      const adminOnlyPages = new Set([
        "inventory",
        "activity",
        "damage",
        "admin",
      ]);
      if (adminOnlyPages.has(activePage)) {
        // Redirect via microtask to avoid sync setState warnings.
        Promise.resolve().then(() => setActivePage("dashboard"));
        return;
      }
    }

    // My Activity refresh logic.
    if (activePage === "activity" || activePage === "my_activity") {
      refreshActivityForActivePage();
    }
  }, [activePage, isAdmin, session]);

  const [photoFilesByToolId, setPhotoFilesByToolId] = useState({});

  useEffect(() => {
    if (!session?.user || !profile) return;

    Promise.all([
      getCompanyUpdates(),
      getCompanyForms(),
      loadVehicleFuelLogs(),
      loadVehicleMaintenanceLogs(),
      getNotifications(),
      getFormAssignments(),
      ...(isAdmin ? [getEmployees()] : []),
    ]);
  }, [session, profile, isAdmin, activePage]);

  useEffect(() => {
    async function initialize() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      if (data.session?.user) {
        await syncProfileName(data.session.user);
        await getProfile(data.session.user.id);
        await Promise.all([
          getTools(),
          getActivity(),
          getCompanyUpdates(),
          getCompanyForms(),
        ]);
      }

      setLoading(false);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        await syncProfileName(nextSession.user);
        await getProfile(nextSession.user.id);
        await Promise.all([
          getTools(),
          getActivity(),
          getCompanyUpdates(),
          getCompanyForms(),
        ]);
      } else {
        setProfile(null);
        setTools([]);
        setActivity([]);
        setDamageReports([]);
        setActivePage("dashboard");
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function syncProfileName(user) {
    if (!user?.id) return;

    const metadataName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "";

    if (!metadataName) return;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single();

    if (!existingProfile) return;

    if (!existingProfile.full_name || existingProfile.full_name.trim() === "") {
      await supabase
        .from("profiles")
        .update({ full_name: metadataName })
        .eq("id", user.id);
    }
  }

  async function getProfile(userId) {
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setProfile(null);
      setMessage(
        "Profile not found. Make sure the user exists in public.profiles and has a role.",
      );
      return;
    }

    setProfile(data);
  }

  async function getCompanyUpdates() {
    const { data, error } = await supabase
      .from("company_updates")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setCompanyUpdates(data || []);
  }

  async function getNotifications() {
    if (!session?.user?.id || !profile?.role) return;

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.or(
        `target_user_id.eq.${session.user.id},target_role.eq.all,target_role.eq.${profile.role}`,
      );
    }

    const { data, error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    setNotifications(data || []);
  }

  async function getCompanyForms() {
    const { data, error } = await supabase
      .from("company_forms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setCompanyForms(data || []);
  }

  async function getFormAssignments() {
    if (!session?.user?.id) return;

    let query = supabase
      .from("form_assignments")
      .select(
        `
        *,
        form:company_forms (
          id,
          title,
          description,
          category,
          link_url,
          file_url,
          is_active
        ),
        user:profiles (
          id,
          full_name,
          role
        )
      `,
      )
      .order("assigned_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("user_id", session.user.id);
    }

    const { data, error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    setFormAssignments(data || []);
  }

  async function getEmployees() {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setEmployees(data || []);
  }

  async function getActivityForCurrentUser() {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setMessage(error.message);
      return;
    }

    setActivity(data || []);
  }

  async function getActivityForCurrentUserFallbackEmail() {
    if (!session?.user?.email) return;

    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("user_email", session.user.email)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setMessage(error.message);
      return;
    }

    setActivity(data || []);
  }

  async function getTools() {
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTools(data || []);
  }

  async function getActivity() {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setMessage(error.message);
      return;
    }

    setActivity(data || []);
  }

  async function refreshActivityForActivePage() {
    // Admin: keep existing behavior (company-wide activity)
    // Employee: filter to "my" activity entries.
    if (!session?.user) return;

    if (activePage === "activity") {
      if (isAdmin) {
        await getActivity();
      } else {
        // Employee should see My Activity, not company-wide.
        // Prefer user_id filter; if missing, fallback to user_email filter.
        if (session?.user?.id) {
          await getActivityForCurrentUser();
        } else {
          await getActivityForCurrentUserFallbackEmail();
        }
      }
    } else if (activePage === "my_activity") {
      if (session?.user?.id) {
        await getActivityForCurrentUser();
      } else {
        await getActivityForCurrentUserFallbackEmail();
      }
    }
  }

  async function getDamageReports() {
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

  async function handleSaveCompanyUpdate(e) {
    e.preventDefault();
    setMessage("");

    if (!updateForm.title.trim() || !updateForm.body.trim()) {
      setMessage("Update title and body are required.");
      return;
    }

    const payload = {
      title: updateForm.title.trim(),
      body: updateForm.body.trim(),
      is_published: updateForm.is_published,
      is_pinned: updateForm.is_pinned,
      created_by: session.user.id,
    };

    const query = updateForm.id
      ? supabase.from("company_updates").update(payload).eq("id", updateForm.id)
      : supabase.from("company_updates").insert(payload);

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    // Company updates have no associated tool.
    await logActivity({
      toolId: null,
      action: updateForm.id ? "companyupdateupdated" : "companyupdatecreated",
      details: "{actor} updated the company updates section",
    });

    resetUpdateForm();
    setMessage(
      updateForm.id ? "Company update saved." : "Company update created.",
    );
    await getCompanyUpdates();
    await getActivity();
  }

  function handleEditCompanyUpdate(item) {
    setUpdateForm({
      id: item.id,
      title: item.title || "",
      body: item.body || "",
      is_published: item.is_published,
      is_pinned: item.is_pinned,
    });
  }

  async function handleDeleteCompanyUpdate(item) {
    const confirmed = window.confirm(`Delete update "${item.title}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("company_updates")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await logActivity({
      toolId: null,
      action: "companyupdatedeleted",
      details: `{actor} deleted company update ${item.title}`,
    });
    setMessage("Company update deleted.");
    await getCompanyUpdates();
    await getActivity();
  }

  async function handleSendNotification(e) {
    e.preventDefault();
    setMessage("");

    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      setMessage("Notification title and message are required.");
      return;
    }

    let payload = {
      title: notificationForm.title.trim(),
      message: notificationForm.message.trim(),
      created_by: session.user.id,
      target_user_id: null,
      target_role: null,
    };

    if (notificationForm.target_mode === "all") {
      payload.target_role = "all";
    } else if (notificationForm.target_mode === "role") {
      payload.target_role = notificationForm.target_role;
    } else if (notificationForm.target_mode === "user") {
      if (!notificationForm.target_user_id) {
        setMessage("Choose an employee.");
        return;
      }
      payload.target_user_id = notificationForm.target_user_id;
    }

    const { error } = await supabase.from("notifications").insert(payload);

    if (error) {
      setMessage(error.message);
      return;
    }

    await logActivity({
      toolId: null,
      action: "notificationsent",
      details: "{actor} sent an employee notification",
    });
    resetNotificationForm();
    setMessage("Notification sent.");
    await getNotifications();
    await getActivity();
  }

  async function handleDeleteNotification(item) {
    const confirmed = window.confirm(`Delete notification "${item.title}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await logActivity(
      null,
      "notificationdeleted",
      "{actor} deleted a notification",
    );
    setMessage("Notification deleted.");
    await getNotifications();
    await getActivity();
  }

  async function handleMarkNotificationRead(notificationId, currentValue) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: !currentValue })
      .eq("id", notificationId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await getNotifications();
  }

  async function handleSaveCompanyForm(e) {
    e.preventDefault();
    setMessage("");

    if (!companyFormForm.title.trim()) {
      setMessage("Form title is required.");
      return;
    }

    if (!companyFormForm.link_url.trim() && !companyFormForm.file_url.trim()) {
      setMessage("Add either a form link URL or file URL.");
      return;
    }

    const payload = {
      title: companyFormForm.title.trim(),
      description: companyFormForm.description.trim(),
      category: companyFormForm.category.trim() || "general",
      link_url: companyFormForm.link_url.trim() || null,
      file_url: companyFormForm.file_url.trim() || null,
      is_active: companyFormForm.is_active,
      created_by: session.user.id,
    };

    const query = companyFormForm.id
      ? supabase
          .from("company_forms")
          .update(payload)
          .eq("id", companyFormForm.id)
      : supabase.from("company_forms").insert(payload);

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    await logActivity({
      toolId: null,
      action: companyFormForm.id ? "formupdated" : "formcreated",
      details: "{actor} updated company forms",
    });

    resetCompanyFormForm();
    setMessage(companyFormForm.id ? "Form saved." : "Form created.");
    await getCompanyForms();
    await getActivity();
  }

  function handleEditCompanyForm(item) {
    setCompanyFormForm({
      id: item.id,
      title: item.title || "",
      description: item.description || "",
      category: item.category || "general",
      link_url: item.link_url || "",
      file_url: item.file_url || "",
      is_active: item.is_active,
    });
  }

  async function handleDeleteCompanyForm(item) {
    const confirmed = window.confirm(`Delete form "${item.title}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("company_forms")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await logActivity(
      null,
      "formdeleted",
      `{actor} deleted form ${item.title}`,
    );
    setMessage("Form deleted.");
    await getCompanyForms();
    await getFormAssignments();
    await getActivity();
  }

  async function handleAssignForm(e) {
    e.preventDefault();
    setMessage("");

    if (!assignmentForm.form_id || !assignmentForm.user_id) {
      setMessage("Choose both a form and an employee.");
      return;
    }

    const payload = {
      form_id: assignmentForm.form_id,
      user_id: assignmentForm.user_id,
      due_date: assignmentForm.due_date || null,
      notes: assignmentForm.notes.trim() || null,
      assigned_by: session.user.id,
      status: "assigned",
    };

    const { error } = await supabase.from("form_assignments").upsert(payload, {
      onConflict: "form_id,user_id",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    await logActivity({
      toolId: null,
      action: "formassigned",
      details: "{actor} assigned a company form",
    });
    resetAssignmentForm();
    setMessage("Form assigned.");
    await getFormAssignments();
    await getActivity();
  }

  async function handleMarkAssignmentStatus(item, nextStatus) {
    const updatePayload = {
      status: nextStatus,
      completed_at:
        nextStatus === "completed" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("form_assignments")
      .update(updatePayload)
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await getFormAssignments();
  }

  async function handleDeleteAssignment(item) {
    const confirmed = window.confirm("Remove this form assignment?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("form_assignments")
      .delete()
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await logActivity(
      null,
      "formassignmentdeleted",
      "{actor} removed a form assignment",
    );
    setMessage("Assignment removed.");
    await getFormAssignments();
    await getActivity();
  }

  async function logActivity({ toolId = null, action, details }) {
    if (!session?.user) return true;

    const actorName =
      profile?.full_name ||
      session.user.user_metadata?.full_name ||
      session.user.email;

    // tool_id is nullable in activity_log; company updates / notifications
    // should log with tool_id = null.
    const safeToolId = toolId ?? null;

    const resolvedDetails =
      typeof details === "string" ? details.replace("{actor}", actorName) : "";

    const { error } = await supabase.from("activity_log").insert({
      tool_id: safeToolId,
      user_id: session.user.id,
      user_email: session.user.email,
      action,
      details: resolvedDetails,
    });

    if (error) {
      // Do not crash the app on activity logging failures.
      console.error("activity_log insert failed:", error);
      setMessage(`Activity log failed: ${error.message}`);
      return false;
    }

    return true;
  }

  async function uploadAssetPhoto(file, toolId, folder = "assets") {
    if (!file || !toolId) return null;

    const extension = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;
    const filePath = `${folder}/${toolId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("asset-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("asset-photos")
      .getPublicUrl(filePath);

    return {
      filePath,
      publicUrl: data.publicUrl,
    };
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setAuthLoading(true);
    setMessage("");

    if (!fullName.trim()) {
      setMessage("Name is required.");
      setAuthLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created. Your name was saved for your profile.");
      setFullName("");
      setEmail("");
      setPassword("");
      setAuthMode("signin");
    }

    setAuthLoading(false);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setAuthLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signed in successfully.");
      setPassword("");
    }

    setAuthLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMessage("Signed out.");
  }

  async function handleAddTool(e) {
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
        const upload = await uploadAssetPhoto(
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

      await logActivity({
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
      await Promise.all([getTools(), getActivity(), getDamageReports()]);
    } catch (uploadError) {
      setMessage(
        `Asset added, but photo upload failed: ${uploadError.message}`,
      );
      await Promise.all([getTools(), getActivity(), getDamageReports()]);
    }
  }

  async function handleAddFuelLog(e) {
    e.preventDefault();
    setMessage("");

    if (!selectedVehicle || !fuelForm.entry_date || !fuelForm.odometer_km) {
      setMessage("Vehicle, date, and odometer are required.");
      return;
    }

    if (!session?.user?.id) {
      setMessage("Not authenticated. Please sign out/in.");
      return;
    }

    try {
      await addVehicleFuelLog({
        toolId: selectedVehicle.id,
        entryDate: fuelForm.entry_date,
        driverName:
          fuelForm.driver_name ||
          profile?.full_name ||
          session.user.email ||
          "",
        odometerKm: fuelForm.odometer_km,
        fuelType: fuelForm.fuel_type,
        pumpStart: fuelForm.pump_start,
        pumpEnd: fuelForm.pump_end,
        notes: fuelForm.notes,
        submittedBy: session.user.id,
      });

      await updateVehicleOdometerIfHigher(
        selectedVehicle.id,
        fuelForm.odometer_km,
      );

      await logActivity({
        toolId: selectedVehicle.id,
        action: "fuel_logged",
        details: `{actor} logged fuel for ${selectedVehicle.name}`,
      });

      setFuelForm({
        tool_id: selectedVehicle.id,
        entry_date: "",
        driver_name: "",
        odometer_km: "",
        fuel_type: "Clear Diesel",
        pump_start: "",
        pump_end: "",
        notes: "",
      });

      setMessage("Fuel log added successfully.");

      await Promise.all([getTools(), getActivity(), loadVehicleFuelLogs()]);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleAddMaintenanceLog(e) {
    e.preventDefault();
    setMessage("");

    if (
      !selectedVehicle ||
      !maintenanceForm.serviceDate ||
      !maintenanceForm.serviceType.trim()
    ) {
      setMessage("Vehicle, service date, and service type are required.");
      return;
    }

    if (!session?.user?.id) {
      setMessage("Not authenticated. Please sign out/in.");
      return;
    }

    try {
      await addVehicleMaintenanceLog({
        toolId: selectedVehicle.id,
        serviceDate: maintenanceForm.serviceDate,
        odometerKm: maintenanceForm.odometerKm,
        serviceType: maintenanceForm.serviceType,
        description: maintenanceForm.description,
        vendor: maintenanceForm.vendor,
        cost: maintenanceForm.cost,
        nextServiceDueDate: maintenanceForm.nextServiceDueDate,
        nextServiceDueKm: maintenanceForm.nextServiceDueKm,
        notes: maintenanceForm.notes,
        submittedBy: session?.user?.id,
      });

      await updateVehicleOdometerIfHigher(
        selectedVehicle.id,
        maintenanceForm.odometerKm,
      );

      await logActivity({
        toolId: selectedVehicle.id,
        action: "maintenance_logged",
        details: `{actor} logged maintenance for ${selectedVehicle.name}`,
      });

      setMaintenanceForm({
        toolId: selectedVehicle.id,
        serviceDate: "",
        odometerKm: "",
        serviceType: "",
        description: "",
        vendor: "",
        cost: "",
        nextServiceDueDate: "",
        nextServiceDueKm: "",
        notes: "",
      });

      setMessage("Maintenance log added successfully.");
      await Promise.all([
        getTools(),
        getActivity(),
        loadVehicleMaintenanceLogs(),
      ]);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteTool(tool) {
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

    await logActivity({
      toolId: tool.id,
      action: "tool_deleted",
      details:
        "{actor} removed " +
        (tool.name || "an asset") +
        (tool.location ? ` from ${tool.location}` : ""),
    });

    setMessage(`${tool.name} deleted successfully.`);
    await Promise.all([getTools(), getActivity(), getDamageReports()]);
  }

  async function handleCheckout(tool) {
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

    const { error: checkoutError } = await supabase.from("checkouts").insert({
      tool_id: tool.id,
      user_email: session.user.email,
      user_id: session.user.id,
      notes: `${tool.name} checked out`,
    });

    if (checkoutError) {
      setMessage(checkoutError.message);
      return;
    }

    const { error: toolError } = await supabase
      .from("tools")
      .update({
        status: "checked_out",
        checked_out_by: session.user.email,
      })
      .eq("id", tool.id)
      .neq("status", "checked_out");

    if (toolError) {
      setMessage(toolError.message);
      return;
    }

    await logActivity({
      toolId: tool.id,
      action: "checkout",
      details:
        "{actor} accessed " +
        (tool.location || "the tool area") +
        " for " +
        (tool.name || "an asset"),
    });

    setMessage(`${tool.name} checked out successfully.`);
    await Promise.all([getTools(), getActivity(), getDamageReports()]);
  }

  async function handleCheckIn(tool) {
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

    const { error: checkoutUpdateError } = await supabase
      .from("checkouts")
      .update({
        checked_in_at: new Date().toISOString(),
        notes: `${tool.name} checked in`,
      })
      .eq("id", checkoutRow.id);

    if (checkoutUpdateError) {
      setMessage(checkoutUpdateError.message);
      return;
    }

    const { error: toolUpdateError } = await supabase
      .from("tools")
      .update({
        status: "available",
        checked_out_by: null,
      })
      .eq("id", tool.id)
      .eq("checked_out_by", session.user.email);

    if (toolUpdateError) {
      setMessage(toolUpdateError.message);
      return;
    }

    await logActivity({
      toolId: tool.id,
      action: "checkin",
      details:
        "{actor} returned " +
        (tool.name || "an asset") +
        (tool.location ? ` to ${tool.location}` : ""),
    });

    setMessage(`${tool.name} checked in successfully.`);
    await Promise.all([getTools(), getActivity(), getDamageReports()]);
  }
  function resetUpdateForm() {
    setUpdateForm({
      id: null,
      title: "",
      body: "",
      is_published: true,
      is_pinned: false,
    });
  }

  function resetNotificationForm() {
    setNotificationForm({
      title: "",
      message: "",
      target_mode: "all",
      target_role: "employee",
      target_user_id: "",
    });
  }

  function resetCompanyFormForm() {
    setCompanyFormForm({
      id: null,
      title: "",
      description: "",
      category: "general",
      link_url: "",
      file_url: "",
      is_active: true,
    });
  }

  function resetAssignmentForm() {
    setAssignmentForm({
      form_id: "",
      user_id: "",
      due_date: "",
      notes: "",
    });
  }
  async function handleReportDamage(e) {
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
        const upload = await uploadAssetPhoto(
          damageForm.photoFile,
          selectedDamageTool.id,
          "reports",
        );
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

      await logActivity({
        toolId: selectedDamageTool.id,
        action: "damage_reported",
        details:
          "{actor} reported " +
          damageForm.report_type +
          " on " +
          (selectedDamageTool.name || "an asset"),
      });

      resetDamageForm();
      setSelectedDamageTool(null);
      setMessage("Damage report submitted.");
      await Promise.all([getTools(), getActivity(), getDamageReports()]);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleResolveDamageReport(report) {
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

    await logActivity({
      toolId: report.tool_id,
      action: "damage_resolved",
      details: "{actor} resolved a damage report",
    });

    setMessage("Damage report resolved.");
    await Promise.all([getTools(), getActivity(), getDamageReports()]);
  }

  async function handleUploadPhotoForTool(tool) {
    if (!isAdmin) return;

    const file = photoFilesByToolId[tool.id];
    if (!file) {
      setMessage("Choose an image first.");
      return;
    }

    try {
      const upload = await uploadAssetPhoto(
        file,
        tool.id,
        tool.asset_type === "vehicle" ? "vehicles" : "tools",
      );

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

      await logActivity({
        toolId: tool.id,
        action: "photo_uploaded",
        details: "{actor} uploaded a photo for " + (tool.name || "an asset"),
      });

      setPhotoFilesByToolId((prev) => ({ ...prev, [tool.id]: null }));
      setMessage("Photo uploaded successfully.");
      await Promise.all([getTools(), getActivity(), getDamageReports()]);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "This removes your app profile row only, not the full auth account. Continue?",
    );

    if (!confirmed || !session?.user?.id) return;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", session.user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();
    setMessage("Profile removed.");
  }

  async function loadVehicleFuelLogs() {
    try {
      const data = await getVehicleFuelLogs();
      setVehicleFuelLogs(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadVehicleMaintenanceLogs() {
    try {
      const data = await getVehicleMaintenanceLogs();
      setVehicleMaintenanceLogs(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  const categories = useMemo(
    () =>
      [...new Set(tools.map((tool) => tool.category).filter(Boolean))].sort(),
    [tools],
  );

  const locations = useMemo(
    () =>
      [...new Set(tools.map((tool) => tool.location).filter(Boolean))].sort(),
    [tools],
  );
  const vehicles = useMemo(
    () => tools.filter((tool) => tool.asset_type === "vehicle"),
    [tools],
  );

  const filteredInventoryTools = useMemo(() => {
    const term = inventorySearch.toLowerCase().trim();

    return tools.filter((tool) => {
      const matchesSearch = `
        ${tool.name || ""}
        ${tool.category || ""}
        ${tool.asset_tag || ""}
        ${tool.status || ""}
        ${tool.condition || ""}
        ${tool.location || ""}
        ${tool.notes || ""}
        ${tool.checked_out_by || ""}
        ${tool.asset_type || ""}
        ${tool.make || ""}
        ${tool.model || ""}
        ${tool.license_plate || ""}
        ${tool.vin || ""}
        ${tool.damage_status || ""}
      `
        .toLowerCase()
        .includes(term);

      const matchesCategory =
        !inventoryCategoryFilter || tool.category === inventoryCategoryFilter;

      const matchesStatus =
        !inventoryStatusFilter || tool.status === inventoryStatusFilter;

      const matchesLocation =
        !inventoryLocationFilter || tool.location === inventoryLocationFilter;

      const matchesAssetType =
        !inventoryAssetTypeFilter ||
        tool.asset_type === inventoryAssetTypeFilter;

      const matchesDamage =
        !inventoryDamageFilter || tool.damage_status === inventoryDamageFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesLocation &&
        matchesAssetType &&
        matchesDamage
      );
    });
  }, [
    tools,
    inventorySearch,
    inventoryCategoryFilter,
    inventoryStatusFilter,
    inventoryLocationFilter,
    inventoryAssetTypeFilter,
    inventoryDamageFilter,
  ]);

  const filteredCheckoutTools = useMemo(() => {
    const term = checkoutSearch.toLowerCase().trim();

    return tools.filter((tool) => {
      const matchesSearch = `
        ${tool.name || ""}
        ${tool.category || ""}
        ${tool.asset_tag || ""}
        ${tool.status || ""}
        ${tool.condition || ""}
        ${tool.location || ""}
        ${tool.notes || ""}
        ${tool.checked_out_by || ""}
        ${tool.asset_type || ""}
        ${tool.make || ""}
        ${tool.model || ""}
        ${tool.license_plate || ""}
      `
        .toLowerCase()
        .includes(term);

      const matchesCategory =
        !checkoutCategoryFilter || tool.category === checkoutCategoryFilter;
      const matchesStatus =
        !checkoutStatusFilter || tool.status === checkoutStatusFilter;
      const matchesLocation =
        !checkoutLocationFilter || tool.location === checkoutLocationFilter;
      const matchesMineOnly =
        !checkoutMineOnly || tool.checked_out_by === session?.user?.email;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesLocation &&
        matchesMineOnly
      );
    });
  }, [
    tools,
    checkoutSearch,
    checkoutCategoryFilter,
    checkoutStatusFilter,
    checkoutLocationFilter,
    checkoutMineOnly,
    session,
  ]);

  const filteredDamageTools = useMemo(() => {
    const term = damageSearch.toLowerCase().trim();

    return tools.filter((tool) => {
      const matchesSearch = `
        ${tool.name || ""}
        ${tool.category || ""}
        ${tool.asset_tag || ""}
        ${tool.status || ""}
        ${tool.condition || ""}
        ${tool.location || ""}
        ${tool.notes || ""}
        ${tool.checked_out_by || ""}
        ${tool.asset_type || ""}
        ${tool.make || ""}
        ${tool.model || ""}
        ${tool.license_plate || ""}
        ${tool.vin || ""}
        ${tool.damage_status || ""}
      `
        .toLowerCase()
        .includes(term);

      return matchesSearch;
    });
  }, [tools, damageSearch]);

  const inventoryCounts = useMemo(() => {
    return {
      total: filteredInventoryTools.length,
      available: filteredInventoryTools.filter(
        (tool) => tool.status !== "checked_out",
      ).length,
      checkedOut: filteredInventoryTools.filter(
        (tool) => tool.status === "checked_out",
      ).length,
      damaged: filteredInventoryTools.filter((tool) => tool.is_damaged).length,
    };
  }, [filteredInventoryTools]);

  const employeeCheckoutGroups = useMemo(() => {
    const grouped = {};
    tools
      .filter((tool) => tool.status === "checked_out")
      .forEach((tool) => {
        const holder = tool.checked_out_by || "Unknown user";
        if (!grouped[holder]) grouped[holder] = [];
        grouped[holder].push(tool);
      });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tools]);

  function formatTimestamp(value) {
    if (!value) return "â€”";
    return new Date(value).toLocaleString();
  }

  function resetDamageForm() {
    setDamageForm({
      title: "",
      description: "",
      severity: "medium",
      report_type: "damage",
      photoFile: null,
    });
  }

  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return renderDashboardPage({
          tools,
          isAdmin,
          companyUpdates,
          notifications,
          formatTimestamp,
          fullName: profile?.full_name,
          sessionEmail: session?.user?.email,
          vehicleMaintenanceLogs,
          setActivePage,
        });

      case "inventory":
        return renderInventoryPage({
          session,
          tools,
          inventorySearch,
          setInventorySearch,
          inventoryCategoryFilter,
          setInventoryCategoryFilter,
          inventoryStatusFilter,
          setInventoryStatusFilter,
          inventoryLocationFilter,
          setInventoryLocationFilter,
          inventoryAssetTypeFilter,
          setInventoryAssetTypeFilter,
          inventoryDamageFilter,
          setInventoryDamageFilter,
          categories,
          locations,
          filteredInventoryTools,
          inventoryCounts,
          setActivePage,
          setSelectedDamageTool,
          resetDamageForm,
        });

      case "vehicles":
        return renderVehiclesPage({
          vehicles,
          selectedVehicle,
          setSelectedVehicle,
          fuelForm,
          setFuelForm,
          maintenanceForm,
          setMaintenanceForm,
          handleAddFuelLog,
          handleAddMaintenanceLog,
          vehicleFuelLogs,
          vehicleMaintenanceLogs,
          setActivePage,
          setSelectedDamageTool,
          resetDamageForm,
        });

      case "my_tools": {
        const myTools = tools.filter(
          (tool) =>
            tool.status === "checked_out" &&
            tool.checked_out_by === session?.user?.email,
        );

        return (
          <section className="panel">
            <div className="section-head">
              <div>
                <h2>My Tools</h2>
                <p>Tools you currently have checked out.</p>
              </div>
            </div>

            {myTools.length === 0 ? (
              <p className="empty-text">No checked-out tools found.</p>
            ) : (
              <div className="tool-grid">
                {myTools.map((tool) => (
                  <div key={tool.id} className="tool-card">
                    <div className="tool-card-top">
                      <h3>{tool.name}</h3>
                      <span className="badge warning">Checked out</span>
                    </div>
                    <div className="tool-meta-list">
                      <p>
                        <strong>Category:</strong> {tool.category || "—"}
                      </p>
                      <p>
                        <strong>Location:</strong> {tool.location || "—"}
                      </p>
                      <p>
                        <strong>Status:</strong> {tool.status || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case "checkout":
        return renderCheckoutPage({
          session,
          tools,
          checkoutSearch,
          setCheckoutSearch,
          checkoutCategoryFilter,
          setCheckoutCategoryFilter,
          checkoutStatusFilter,
          setCheckoutStatusFilter,
          checkoutLocationFilter,
          setCheckoutLocationFilter,
          checkoutMineOnly,
          setCheckoutMineOnly,
          categories,
          locations,
          filteredCheckoutTools,
          handleCheckout,
          handleCheckIn,
          setActivePage,
          setSelectedDamageTool,
          resetDamageForm,
        });

      case "damage":
        return renderDamagePage({
          damageSearch,
          setDamageSearch,
          filteredDamageTools,
          selectedDamageTool,
          setSelectedDamageTool,
          resetDamageForm,
          damageForm,
          setDamageForm,
          handleReportDamage,
          damageReports,
          tools,
          formatTimestamp,
        });

      case "activity":
        return renderActivityPage({
          activity,
          formatTimestamp,
        });

      case "my_activity":
        return renderActivityPage({
          activity,
          formatTimestamp,
        });

      case "account":
        return renderAccountPage({
          session,
          profile,
          notifications,
          formAssignments,
          formatTimestamp,
          handleMarkAssignmentStatus,
          handleMarkNotificationRead,
          handleDeleteAccount,
        });

      case "admin":
        return renderAdminPage({
          isAdmin,
          tools,
          session,
          photoFilesByToolId,
          setPhotoFilesByToolId,
          handleUploadPhotoForTool,
          handleDeleteTool,
          damageReports,
          employees,
          notifications,
          companyUpdates,
          companyForms,
          formAssignments,
          formatTimestamp,
          handleResolveDamageReport,
          handleSaveCompanyUpdate,
          handleEditCompanyUpdate,
          handleDeleteCompanyUpdate,
          updateForm,
          setUpdateForm,
          resetUpdateForm,
          handleSendNotification,
          handleDeleteNotification,
          handleSaveCompanyForm,
          handleEditCompanyForm,
          handleDeleteCompanyForm,
          handleAssignForm,
          handleMarkAssignmentStatus,
          handleDeleteAssignment,
          resetNotificationForm,
          resetCompanyFormForm,
          resetAssignmentForm,
          notificationForm,
          setNotificationForm,
          companyFormForm,
          setCompanyFormForm,
          assignmentForm,
          setAssignmentForm,
          handleMarkNotificationRead,
          newTool,
          setNewTool,
          handleAddTool,
        });

      default:
        return renderDashboardPage({
          tools,
          isAdmin,
          companyUpdates,
          notifications,
          formatTimestamp,
          fullName: profile?.full_name,
          sessionEmail: session?.user?.email,
          vehicleMaintenanceLogs,
        });
    }
  }

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo-text">
              <span className="auth-logo-initials">AT</span>
            </div>
            <div>
              <h1>AssetTrack</h1>
              <p>Portfolio Inventory Management Demo</p>
            </div>
          </div>

          <div className="auth-copy">
            <h2>{authMode === "signin" ? "Sign In" : "Create Account"}</h2>
            <p>
              {authMode === "signin"
                ? "Use your email and password to access the dashboard."
                : "Create a new employee account and save your name to the profile."}
            </p>
          </div>

          {authMode === "signin" ? (
            <form className="auth-form" onSubmit={handleSignIn}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <div className="auth-actions">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={authLoading}
                >
                  {authLoading ? "Signing In..." : "Sign In"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setAuthMode("signup");
                  }}
                >
                  Create Account
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignUp}>
              <label>
                <span>Name</span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <div className="auth-actions">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={authLoading}
                >
                  {authLoading ? "Creating..." : "Create Account"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setAuthMode("signin");
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {message && <p className="auth-message">{message}</p>}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app-loading">
        <div>
          Loading profile...
          {message && <div className="auth-message">{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-initials">AT</span>
          </div>
          <div>
            <strong>AssetTrack</strong>
            <span>{isAdmin ? "Admin Console" : "Employee View"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "checkout" ? "active" : ""}`}
            onClick={() => setActivePage("checkout")}
          >
            Checkout
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "my_tools" ? "active" : ""}`}
            onClick={() => setActivePage("my_tools")}
          >
            My Tools
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${activePage === "inventory" ? "active" : ""}`}
              onClick={() => setActivePage("inventory")}
            >
              Inventory
            </button>
          )}

          <button
            type="button"
            className={`nav-item ${activePage === "vehicles" ? "active" : ""}`}
            onClick={() => setActivePage("vehicles")}
          >
            Vehicles
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${activePage === "damage" ? "active" : ""}`}
              onClick={() => setActivePage("damage")}
            >
              Damage
            </button>
          )}

          {isAdmin ? (
            <button
              type="button"
              className={`nav-item ${activePage === "activity" ? "active" : ""}`}
              onClick={() => setActivePage("activity")}
            >
              Activity
            </button>
          ) : (
            <button
              type="button"
              className={`nav-item ${
                activePage === "my_activity" || activePage === "activity"
                  ? "active"
                  : ""
              }`}
              onClick={() => setActivePage("my_activity")}
            >
              My Activity
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              className={`nav-item ${activePage === "admin" ? "active" : ""}`}
              onClick={() => setActivePage("admin")}
            >
              Admin
            </button>
          )}

          <button
            type="button"
            className={`nav-item ${activePage === "account" ? "active" : ""}`}
            onClick={() => setActivePage("account")}
          >
            Account
          </button>
        </nav>
      </aside>

      <main className="main-panel">
        <div className="topbar">
          <div>
            <h1>{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h1>
            <p>
              Signed in as{" "}
              <strong>{profile.full_name || session.user.email}</strong>
            </p>
          </div>

          <div className="topbar-actions">
            <div className="user-chip">
              <strong>{profile.role}</strong>
              <small>{session.user.email}</small>
            </div>
            <button className="btn btn-secondary" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>

        <div className="content-area">
          {message && <p className="auth-message">{message}</p>}
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;

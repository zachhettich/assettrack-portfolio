/*
  DashboardPage.jsx
  ---------------------------------------
  Dashboard page UI.

  This file controls:
  - Weather (placeholder)
  - Updates & Notifications
  - Vehicle Maintenance overview
  - Checked-out tools overview

  Data is passed in from App.jsx.
*/
import WeatherCard from "../components/WeatherCard";
export default function DashboardPage({
  tools,
  isAdmin,
  companyUpdates,
  notifications,
  formatTimestamp,
  fullName,
  sessionEmail,
  vehicleMaintenanceLogs,
  setActivePage,
}) {
  const profileFirstName = (() => {
    const name = fullName?.trim?.() || "";
    if (!name) return null;
    const parts = name.split(/\s+/).filter(Boolean);
    return parts[0] || null;
  })();

  const greetingFirstName = profileFirstName || fullName || "";

  const weatherPanel = <WeatherCard />;

  const publishedUpdates = Array.isArray(companyUpdates)
    ? companyUpdates.filter((u) => u?.is_published)
    : [];

  const unreadNotifications = Array.isArray(notifications)
    ? notifications.filter((n) => !n?.is_read)
    : [];

  const companyUpdatesPanel = (
    <section className="dashboard-card panel-card">
      <div className="panel-card-head">
        <h3>Company Updates</h3>
        <span className="badge neutral">
          {publishedUpdates.length > 0 ? "Live" : "None"}
        </span>
      </div>

      {publishedUpdates.length === 0 ? (
        <p className="empty-text dashboard-empty">No updates.</p>
      ) : (
        <div className="dashboard-item-list">
          {publishedUpdates.slice(0, 3).map((u) => (
            <div key={u.id} className="dashboard-item">
              <div className="dashboard-item-main">
                <strong>{u.title || "Untitled"}</strong>
                {u.is_pinned ? (
                  <span className="badge neutral pinned">Pinned</span>
                ) : null}
              </div>
              <p className="dashboard-item-sub">{u.body || "â€”"}</p>
              {u.created_at ? (
                <p className="dashboard-item-meta">
                  {formatTimestamp(u.created_at)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const notificationsPanel = (
    <section className="dashboard-card panel-card">
      <div className="panel-card-head">
        <h3>Notifications</h3>
        <span className="badge warning">
          {unreadNotifications.length} unread
        </span>
      </div>

      {unreadNotifications.length === 0 ? (
        <p className="empty-text dashboard-empty">No notifications.</p>
      ) : (
        <div className="dashboard-item-list">
          {unreadNotifications.slice(0, 3).map((n) => (
            <div key={n.id} className="dashboard-item">
              <div className="dashboard-item-main">
                <strong>{n.title || "Notification"}</strong>
                <span className="badge warning">Unread</span>
              </div>
              <p className="dashboard-item-sub">{n.message || "â€”"}</p>
              {n.created_at ? (
                <p className="dashboard-item-meta">
                  {formatTimestamp(n.created_at)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const maintenanceAlerts = (() => {
    const logs = Array.isArray(vehicleMaintenanceLogs)
      ? vehicleMaintenanceLogs
      : [];

    // Derive upcoming/overdue items only from existing fields.
    // next_service_due_date: compare to now
    // next_service_due_km: compare to vehicle tool's odometer (if available)
    const now = new Date();

    const vehicleById = new Map(
      (tools || [])
        .filter((t) => t?.asset_type === "vehicle")
        .map((t) => [t.id, t]),
    );

    const alerts = logs
      .map((log) => {
        const dueDateRaw = log?.next_service_due_date;
        const dueKmRaw = log?.next_service_due_km;

        const vehicle = vehicleById.get(log?.tool_id);
        const odometer = vehicle?.odometer ?? null;

        let dueStatus = null;
        let dueLabel = null;

        if (dueDateRaw) {
          const dueDate = new Date(dueDateRaw);
          if (!Number.isNaN(dueDate.getTime())) {
            const diffMs = dueDate.getTime() - now.getTime();
            dueStatus = diffMs < 0 ? "overdue" : "upcoming";
            dueLabel = dueDateRaw;
          }
        } else if (dueKmRaw != null && dueKmRaw !== "") {
          const dueKm = Number(dueKmRaw);
          const odo =
            odometer == null || odometer === "" ? null : Number(odometer);

          if (odo != null && !Number.isNaN(dueKm) && !Number.isNaN(odo)) {
            dueStatus = dueKm < odo ? "overdue" : "upcoming";
            dueLabel = `${dueKm} km`;
          }
        }

        return {
          id: log.id,
          tool_id: log.tool_id,
          service_date: log.service_date,
          service_type: log.service_type,
          next_service_due_date: log.next_service_due_date,
          next_service_due_km: log.next_service_due_km,
          dueStatus,
          dueLabel,
          vehicle,
        };
      })
      .filter((a) => a.dueStatus);

    alerts.sort((a, b) => {
      if (a.dueStatus === b.dueStatus) return 0;
      if (a.dueStatus === "overdue") return -1;
      return 1;
    });

    return alerts;
  })();

  // Preserve existing computed maintenance panel for future use in the dashboard.
  // It is intentionally not rendered in the Quick Actions task.
  // (Intentionally not rendered by default; kept to preserve existing computed logic)
  const maintenancePanel = (
    <div className="panel-card">
      <div className="panel-card-head">
        <h3>Vehicle Maintenance</h3>
        <span className="badge warning">
          {maintenanceAlerts.filter((a) => a.dueStatus === "overdue").length}{" "}
          overdue
        </span>
      </div>

      {maintenanceAlerts.length === 0 ? (
        <p className="empty-text dashboard-empty">
          No maintenance alerts available.
        </p>
      ) : (
        <div className="dashboard-item-list compact">
          {maintenanceAlerts.slice(0, 6).map((a) => (
            <div key={a.id} className="dashboard-item dashboard-row">
              <div className="dashboard-row-main">
                <div className="dashboard-row-title">
                  <strong>{a.vehicle?.name || "Vehicle"}</strong>
                  {a.dueStatus === "overdue" ? (
                    <span className="badge warning">Overdue</span>
                  ) : (
                    <span className="badge success">Upcoming</span>
                  )}
                </div>
                <p className="dashboard-item-sub">
                  {a.service_type || "Service"}
                  {a.dueLabel ? ` — due ${a.dueLabel}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // maintenancePanel kept for parity with existing computed logic (not rendered).

  const employeeCheckedOut = (tools || []).filter(
    (tool) =>
      tool?.status === "checked_out" && tool?.checked_out_by === sessionEmail,
  );

  const adminCheckedOut = (tools || []).filter(
    (tool) => tool?.status === "checked_out",
  );

  const checkedOutPanel = isAdmin ? (
    <div className="panel-card">
      <div className="panel-card-head">
        <h3>Currently Checked Out</h3>
        <span className="badge neutral">{adminCheckedOut.length} items</span>
      </div>

      {adminCheckedOut.length === 0 ? (
        <p className="empty-text dashboard-empty">
          No tools are currently checked out.
        </p>
      ) : (
        <div className="dashboard-compact-list">
          {adminCheckedOut.slice(0, 12).map((tool) => (
            <div key={tool.id} className="compact-row">
              <div className="compact-row-main">
                <strong>{tool.name || "Tool"}</strong>
                <span className="compact-sub">
                  Asset: {tool.asset_tag || "—"}
                </span>
              </div>
              <div className="compact-meta">
                <span>{tool.location || "—"}</span>
                <span className="dot">•</span>
                <span>By {tool.checked_out_by || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="panel-card">
      <div className="panel-card-head">
        <h3>My Checked-Out Tools</h3>
        <span className="badge neutral">{employeeCheckedOut.length} items</span>
      </div>

      {employeeCheckedOut.length === 0 ? (
        <p className="empty-text dashboard-empty">
          No checked-out tools available.
        </p>
      ) : (
        <div className="dashboard-compact-list">
          {employeeCheckedOut.slice(0, 12).map((tool) => (
            <div key={tool.id} className="compact-row">
              <div className="compact-row-main">
                <strong>{tool.name || "Tool"}</strong>
                <span className="compact-sub">
                  Asset: {tool.asset_tag || "—"}
                </span>
              </div>
              <div className="compact-meta">
                <span>{tool.location || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-shell">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {greetingFirstName}</h2>
          <div className="dashboard-role-label">
            {isAdmin ? "Administrator dashboard" : "Employee dashboard"}
          </div>
        </div>
      </div>

      <section className="dashboard-grid">
        <div className="dashboard-col">{weatherPanel}</div>
        <div className="dashboard-col">{companyUpdatesPanel}</div>
        <div className="dashboard-col">{notificationsPanel}</div>
        <div className="dashboard-col">{maintenancePanel}</div>
        <div className="dashboard-col wide">{checkedOutPanel}</div>
      </section>

      <section className="panel quick-actions-panel" aria-label="Quick Actions">
        <div className="section-head">
          <div>
            <h2>Quick Actions</h2>
            <p>Common tasks to keep your day moving.</p>
          </div>
          <span className="badge neutral">
            {isAdmin ? "Admin" : "Employee"}
          </span>
        </div>

        <div className="quick-actions-grid">
          {/** Employee actions (non-admin only) */}
          {!isAdmin && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("vehicles")}
              >
                <span className="quick-action-icon">⛽️</span>
                <span className="quick-action-title">Log Fuel</span>
                <span className="quick-action-desc">
                  Update fuel usage for vehicles
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("checkout")}
              >
                <span className="quick-action-icon">🧰</span>
                <span className="quick-action-title">
                  Check Out / Return Tools
                </span>
                <span className="quick-action-desc">
                  Find, check out, and manage tools
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("my_tools")}
              >
                <span className="quick-action-icon">🧾</span>
                <span className="quick-action-title">My Tools</span>
                <span className="quick-action-desc">
                  View tools you currently have checked out
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("my_activity")}
              >
                <span className="quick-action-icon">📈</span>
                <span className="quick-action-title">My Activity</span>
                <span className="quick-action-desc">
                  View your recent system activity
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("vehicles")}
              >
                <span className="quick-action-icon">🚚</span>
                <span className="quick-action-title">Vehicles</span>
                <span className="quick-action-desc">
                  Track vehicle details and history
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("damage")}
              >
                <span className="quick-action-icon">⚠️</span>
                <span className="quick-action-title">Report Damage</span>
                <span className="quick-action-desc">
                  Submit a damage report
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("vehicles")}
              >
                <span className="quick-action-icon">🚚</span>
                <span className="quick-action-title">Vehicles</span>
                <span className="quick-action-desc">
                  Track vehicle details and history
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("account")}
              >
                <span className="quick-action-icon">👤</span>
                <span className="quick-action-title">Account</span>
                <span className="quick-action-desc">
                  Your profile and forms
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card quick-action-card--disabled"
                disabled
              >
                <span className="quick-action-icon">🛡️</span>
                <span className="quick-action-title">Vehicle Safety Sheet</span>
                <span className="quick-action-desc">Coming soon</span>
              </button>
            </>
          )}

          {/** Admin actions */}
          {isAdmin && (
            <>
              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("checkout")}
              >
                <span className="quick-action-icon">↔️</span>
                <span className="quick-action-title">
                  Check Out / Return Tools
                </span>
                <span className="quick-action-desc">
                  Manage checkouts and returns
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("inventory")}
              >
                <span className="quick-action-icon">📦</span>
                <span className="quick-action-title">Inventory</span>
                <span className="quick-action-desc">
                  Browse tools and vehicles
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("admin")}
              >
                <span className="quick-action-icon">➕</span>
                <span className="quick-action-title">Add Asset</span>
                <span className="quick-action-desc">
                  Create and catalog assets
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("admin")}
              >
                <span className="quick-action-icon">🗂️</span>
                <span className="quick-action-title">Manage Assets</span>
                <span className="quick-action-desc">
                  Update and maintain asset records
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("activity")}
              >
                <span className="quick-action-icon">🏢</span>
                <span className="quick-action-title">Company Activity</span>
                <span className="quick-action-desc">
                  Review system activity for all users
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("damage")}
              >
                <span className="quick-action-icon">🧯</span>
                <span className="quick-action-title">Damage Reports</span>
                <span className="quick-action-desc">
                  View and resolve damage reports
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("vehicles")}
              >
                <span className="quick-action-icon">🚗</span>
                <span className="quick-action-title">
                  Vehicles &amp; Fuel Logs
                </span>
                <span className="quick-action-desc">
                  Fuel entries and vehicle history
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("vehicles")}
              >
                <span className="quick-action-icon">🧰</span>
                <span className="quick-action-title">Maintenance Logs</span>
                <span className="quick-action-desc">
                  Service records for vehicles
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("admin")}
              >
                <span className="quick-action-icon">📣</span>
                <span className="quick-action-title">Post Company Update</span>
                <span className="quick-action-desc">
                  Publish a new company update
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("admin")}
              >
                <span className="quick-action-icon">🧾</span>
                <span className="quick-action-title">
                  Forms &amp; Assignments
                </span>
                <span className="quick-action-desc">
                  Manage forms and assignments
                </span>
              </button>

              <button
                type="button"
                className="quick-action-card"
                onClick={() => setActivePage("account")}
              >
                <span className="quick-action-icon">👤</span>
                <span className="quick-action-title">Account</span>
                <span className="quick-action-desc">
                  Your profile, notifications, and assignments
                </span>
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

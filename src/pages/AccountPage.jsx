/*
  AccountPage.jsx
  ---------------------------------------
  Account/profile page UI.

  This file controls:
  - Basic employee profile display
    - name
    - email
    - role
  - Employee forms section
    - onboarding forms
    - safety forms
    - vehicle-use forms
    - completion status
  - Danger zone section
    - delete account profile button

  This file is display-focused only.
  Data and actions are passed in from App.jsx.
*/

export default function AccountPage({ profile, session, handleDeleteAccount }) {
  const forms = [
    {
      title: "New Hire Package",
      status: "complete",
      detail: "Tax forms, emergency contact, and employment documents.",
      timeline: "Completed",
    },
    {
      title: "Tool Responsibility Agreement",
      status: "pending",
      detail: "Acknowledges tool care, reporting, and check-out rules.",
      timeline: "Due this week",
    },
    {
      title: "Vehicle Use & Safety Form",
      status: "pending",
      detail: "Required before driving trucks, trailers, or company vehicles.",
      timeline: "Required before vehicle assignment",
    },
    {
      title: "Seasonal Safety Acknowledgement",
      status: "complete",
      detail: "Heat, lifting, PPE, and jobsite safety expectations.",
      timeline: "Completed",
    },
  ];

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Account</h2>
            <p>Basic profile and account actions.</p>
          </div>
        </div>

        <div className="tool-grid">
          <div className="tool-card">
            <h3>Name</h3>
            <p>{profile?.full_name || "—"}</p>
          </div>

          <div className="tool-card">
            <h3>Email</h3>
            <p>{session?.user?.email || "—"}</p>
          </div>

          <div className="tool-card">
            <h3>Role</h3>
            <p>{profile?.role || "—"}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Employee Forms</h2>
            <p>
              Track onboarding, safety, and vehicle-use forms assigned to this
              employee.
            </p>
          </div>
        </div>

        <div className="tool-grid">
          {forms.map((form) => (
            <div key={form.title} className="tool-card">
              <div className="tool-card-top">
                <h3>{form.title}</h3>
                <span
                  className={`badge ${form.status === "complete" ? "success" : "warning"}`}
                >
                  {form.status === "complete" ? "Complete" : "Pending"}
                </span>
              </div>

              <div className="tool-meta-list">
                <p>
                  <strong>Status:</strong> {form.status}
                </p>
                <p>
                  <strong>Timeline:</strong> {form.timeline}
                </p>
                <p>{form.detail}</p>
              </div>

              <div className="button-row">
                <button type="button" className="btn btn-secondary">
                  View Form
                </button>
                <button type="button" className="btn btn-primary">
                  {form.status === "complete"
                    ? "Download Copy"
                    : "Complete Form"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Danger Zone</h2>
            <p>Use caution with account actions.</p>
          </div>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="btn danger-button"
            onClick={handleDeleteAccount}
          >
            Delete Account Profile
          </button>
        </div>

        <p className="helper-text">
          This removes your app profile row only. Full auth-user deletion should
          be done securely from the backend or Supabase admin side.
        </p>
      </section>
    </>
  );
}

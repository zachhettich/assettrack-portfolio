import AssetCard from "../../components/AssetCard";

export default function renderAdminPage(props) {
  const {
    isAdmin,
    tools,
    session,

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
    companyFormForm,
    assignmentForm,
  } = props;

  if (!isAdmin) {
    return (
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Admin</h2>
            <p>You do not have access to this page.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Add Asset</h2>
            <p>Enter a new tool or vehicle record.</p>
          </div>
        </div>

        <form className="tool-form" onSubmit={props.handleAddTool}>
          <label>
            <span>Asset Type</span>
            <select
              className="filter-control"
              value={props.newTool.asset_type}
              onChange={(e) =>
                props.setNewTool({
                  ...props.newTool,
                  asset_type: e.target.value,
                })
              }
            >
              <option value="tool">Tool</option>
              <option value="vehicle">Vehicle</option>
            </select>
          </label>

          <input
            placeholder="Asset Name"
            value={props.newTool.name}
            onChange={(e) =>
              props.setNewTool({ ...props.newTool, name: e.target.value })
            }
          />

          <input
            placeholder="Category"
            value={props.newTool.category}
            onChange={(e) =>
              props.setNewTool({
                ...props.newTool,
                category: e.target.value,
              })
            }
          />

          <input
            placeholder="Asset Tag"
            value={props.newTool.asset_tag}
            onChange={(e) =>
              props.setNewTool({
                ...props.newTool,
                asset_tag: e.target.value,
              })
            }
          />

          <input
            placeholder="Condition"
            value={props.newTool.condition}
            onChange={(e) =>
              props.setNewTool({
                ...props.newTool,
                condition: e.target.value,
              })
            }
          />

          <input
            placeholder="Location"
            value={props.newTool.location}
            onChange={(e) =>
              props.setNewTool({
                ...props.newTool,
                location: e.target.value,
              })
            }
          />

          {props.newTool.asset_type === "vehicle" && (
            <>
              <input
                placeholder="Make"
                value={props.newTool.make}
                onChange={(e) =>
                  props.setNewTool({
                    ...props.newTool,
                    make: e.target.value,
                  })
                }
              />

              <input
                placeholder="Model"
                value={props.newTool.model}
                onChange={(e) =>
                  props.setNewTool({
                    ...props.newTool,
                    model: e.target.value,
                  })
                }
              />

              <input
                placeholder="Year"
                type="number"
                value={props.newTool.year}
                onChange={(e) =>
                  props.setNewTool({
                    ...props.newTool,
                    year: e.target.value,
                  })
                }
              />

              <input
                placeholder="License Plate"
                value={props.newTool.license_plate}
                onChange={(e) =>
                  props.setNewTool({
                    ...props.newTool,
                    license_plate: e.target.value,
                  })
                }
              />

              <input
                placeholder="VIN"
                value={props.newTool.vin}
                onChange={(e) =>
                  props.setNewTool({
                    ...props.newTool,
                    vin: e.target.value,
                  })
                }
              />

              <input
                placeholder="Odometer"
                type="number"
                value={props.newTool.odometer}
                onChange={(e) =>
                  props.setNewTool({
                    ...props.newTool,
                    odometer: e.target.value,
                  })
                }
              />
            </>
          )}

          <input
            placeholder="Notes"
            value={props.newTool.notes}
            onChange={(e) =>
              props.setNewTool({ ...props.newTool, notes: e.target.value })
            }
          />

          <label className="asset-upload-inline">
            <span>Primary Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                props.setNewTool({
                  ...props.newTool,
                  photoFile: e.target.files?.[0] ?? null,
                })
              }
            />
          </label>

          <button className="btn btn-primary" type="submit">
            Add Asset
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Admin Actions</h2>
            <p>Manage assets, upload photos, and review assignments.</p>
          </div>
        </div>

        {tools.length === 0 ? (
          <p className="empty-text">No assets found.</p>
        ) : (
          <div className="tool-grid">
            {tools.map((tool) => (
              <AssetCard
                key={tool.id}
                tool={tool}
                currentUserEmail={session?.user?.email}
                showAdminControls
                onPhotoFileChange={(toolId, file) =>
                  setPhotoFilesByToolId((prev) => ({
                    ...prev,
                    [toolId]: file,
                  }))
                }
                onUploadPhoto={handleUploadPhotoForTool}
                onDelete={handleDeleteTool}
              />
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Damage Reports</h2>
            <p>Review reported damage and mark issues as resolved.</p>
          </div>
        </div>

        {damageReports.length === 0 ? (
          <p className="empty-text">No damage reports found.</p>
        ) : (
          <div className="tool-grid">
            {damageReports.map((report) => {
              const tool = tools.find((item) => item.id === report.tool_id);

              return (
                <div key={report.id} className="tool-card">
                  {report.photo_url && (
                    <img
                      src={report.photo_url}
                      alt={report.title}
                      className="asset-image"
                    />
                  )}

                  <div className="tool-card-top">
                    <h3>{report.title}</h3>
                    <span
                      className={`badge ${
                        report.status === "resolved" ? "success" : "warning"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <div className="tool-meta-list">
                    <p>
                      <strong>Asset:</strong>{" "}
                      {tool?.name || `#${report.tool_id}`}
                    </p>
                    <p>
                      <strong>Type:</strong> {report.report_type}
                    </p>
                    <p>
                      <strong>Severity:</strong> {report.severity}
                    </p>
                    <p>
                      <strong>Description:</strong> {report.description}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatTimestamp(report.created_at)}
                    </p>
                  </div>

                  {report.status !== "resolved" && (
                    <div className="button-row">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleResolveDamageReport(report)}
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Company Updates</h2>
              <p>Create, edit, publish, and pin updates for the dashboard.</p>
            </div>
          </div>

          <form className="tool-form" onSubmit={handleSaveCompanyUpdate}>
            <input
              placeholder="Update Title"
              value={updateForm.title}
              onChange={(e) =>
                props.setUpdateForm({
                  ...updateForm,
                  title: e.target.value,
                })
              }
            />

            <select
              className="filter-control"
              value={updateForm.is_published ? "published" : "draft"}
              onChange={(e) =>
                props.setUpdateForm({
                  ...updateForm,
                  is_published: e.target.value === "published",
                })
              }
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              className="filter-control"
              value={updateForm.is_pinned ? "pinned" : "normal"}
              onChange={(e) =>
                props.setUpdateForm({
                  ...updateForm,
                  is_pinned: e.target.value === "pinned",
                })
              }
            >
              <option value="normal">Normal</option>
              <option value="pinned">Pinned</option>
            </select>

            <textarea
              placeholder="Update body"
              value={updateForm.body}
              onChange={(e) =>
                props.setUpdateForm({
                  ...updateForm,
                  body: e.target.value,
                })
              }
            />

            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                {updateForm.id ? "Save Update" : "Post Update"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetUpdateForm}
              >
                Clear
              </button>
            </div>
          </form>

          {companyUpdates.length === 0 ? (
            <p className="empty-text">No updates yet.</p>
          ) : (
            <div className="tool-grid">
              {companyUpdates.map((item) => (
                <div key={item.id} className="tool-card">
                  <div className="tool-card-top">
                    <h3>{item.title}</h3>
                    <span
                      className={`badge ${item.is_published ? "success" : "warning"}`}
                    >
                      {item.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="tool-meta-list">
                    <p>{item.body}</p>
                    <p>
                      <strong>Pinned:</strong> {item.is_pinned ? "Yes" : "No"}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatTimestamp(item.created_at)}
                    </p>
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleEditCompanyUpdate(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger-button"
                      onClick={() => handleDeleteCompanyUpdate(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Send Notifications</h2>
              <p>Send messages to everyone, a role, or one employee.</p>
            </div>
          </div>

          <form className="tool-form" onSubmit={handleSendNotification}>
            <input
              placeholder="Notification Title"
              value={notificationForm.title}
              onChange={(e) =>
                props.setNotificationForm({
                  ...notificationForm,
                  title: e.target.value,
                })
              }
            />

            <select
              className="filter-control"
              value={notificationForm.target_mode}
              onChange={(e) =>
                props.setNotificationForm({
                  ...notificationForm,
                  target_mode: e.target.value,
                })
              }
            >
              <option value="all">Send to Everyone</option>
              <option value="role">Send by Role</option>
              <option value="user">Send to One Employee</option>
            </select>

            {notificationForm.target_mode === "role" ? (
              <select
                className="filter-control"
                value={notificationForm.target_role}
                onChange={(e) =>
                  props.setNotificationForm({
                    ...notificationForm,
                    target_role: e.target.value,
                  })
                }
              >
                <option value="employee">Employees</option>
                <option value="admin">Admins</option>
              </select>
            ) : notificationForm.target_mode === "user" ? (
              <select
                className="filter-control"
                value={notificationForm.target_user_id}
                onChange={(e) =>
                  props.setNotificationForm({
                    ...notificationForm,
                    target_user_id: e.target.value,
                  })
                }
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullname || employee.id}
                  </option>
                ))}
              </select>
            ) : (
              <div className="helper-inline">
                Everyone will receive this notification.
              </div>
            )}

            <textarea
              placeholder="Notification message"
              value={notificationForm.message}
              onChange={(e) =>
                props.setNotificationForm({
                  ...notificationForm,
                  message: e.target.value,
                })
              }
            />

            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                Send Notification
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetNotificationForm}
              >
                Clear
              </button>
            </div>
          </form>

          {notifications.length === 0 ? (
            <p className="empty-text">No notifications found.</p>
          ) : (
            <div className="tool-grid">
              {notifications.map((item) => (
                <div key={item.id} className="tool-card">
                  <div className="tool-card-top">
                    <h3>{item.title}</h3>
                    <span
                      className={`badge ${item.is_read ? "success" : "warning"}`}
                    >
                      {item.is_read ? "Read" : "Unread"}
                    </span>
                  </div>

                  <div className="tool-meta-list">
                    <p>{item.message}</p>
                    <p>
                      <strong>Target User:</strong>{" "}
                      {item.target_user_id || "â€”"}
                    </p>
                    <p>
                      <strong>Target Role:</strong> {item.target_role || "â€”"}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatTimestamp(item.created_at)}
                    </p>
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="btn danger-button"
                      onClick={() => handleDeleteNotification(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Manage Forms</h2>
              <p>Create reusable forms and links for employees.</p>
            </div>
          </div>

          <form className="tool-form" onSubmit={handleSaveCompanyForm}>
            <input
              placeholder="Form Title"
              value={companyFormForm.title}
              onChange={(e) =>
                props.setCompanyFormForm({
                  ...companyFormForm,
                  title: e.target.value,
                })
              }
            />

            <input
              placeholder="Category"
              value={companyFormForm.category}
              onChange={(e) =>
                props.setCompanyFormForm({
                  ...companyFormForm,
                  category: e.target.value,
                })
              }
            />

            <input
              placeholder="Form Link URL"
              value={companyFormForm.link_url}
              onChange={(e) =>
                props.setCompanyFormForm({
                  ...companyFormForm,
                  link_url: e.target.value,
                })
              }
            />

            <input
              placeholder="Optional File URL"
              value={companyFormForm.file_url}
              onChange={(e) =>
                props.setCompanyFormForm({
                  ...companyFormForm,
                  file_url: e.target.value,
                })
              }
            />

            <select
              className="filter-control"
              value={companyFormForm.is_active ? "active" : "inactive"}
              onChange={(e) =>
                props.setCompanyFormForm({
                  ...companyFormForm,
                  is_active: e.target.value === "active",
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <textarea
              placeholder="Form description"
              value={companyFormForm.description}
              onChange={(e) =>
                props.setCompanyFormForm({
                  ...companyFormForm,
                  description: e.target.value,
                })
              }
            />

            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                {companyFormForm.id ? "Save Form" : "Create Form"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetCompanyFormForm}
              >
                Clear
              </button>
            </div>
          </form>

          {companyForms.length === 0 ? (
            <p className="empty-text">No forms created yet.</p>
          ) : (
            <div className="tool-grid">
              {companyForms.map((item) => (
                <div key={item.id} className="tool-card">
                  <div className="tool-card-top">
                    <h3>{item.title}</h3>
                    <span
                      className={`badge ${item.is_active ? "success" : "warning"}`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="tool-meta-list">
                    <p>
                      <strong>Category:</strong> {item.category}
                    </p>
                    <p>
                      <strong>Description:</strong> {item.description || "â€”"}
                    </p>
                    <p>
                      <strong>Link:</strong> {item.link_url || "â€”"}
                    </p>
                    <p>
                      <strong>File:</strong> {item.file_url || "â€”"}
                    </p>
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleEditCompanyForm(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn danger-button"
                      onClick={() => handleDeleteCompanyForm(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Assign Forms</h2>
              <p>Assign forms to employees and track completion.</p>
            </div>
          </div>

          <form className="tool-form" onSubmit={handleAssignForm}>
            <select
              className="filter-control"
              value={assignmentForm.form_id}
              onChange={(e) =>
                props.setAssignmentForm({
                  ...assignmentForm,
                  form_id: e.target.value,
                })
              }
            >
              <option value="">Select Form</option>
              {companyForms
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>

            <select
              className="filter-control"
              value={assignmentForm.user_id}
              onChange={(e) =>
                props.setAssignmentForm({
                  ...assignmentForm,
                  user_id: e.target.value,
                })
              }
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullname || employee.id}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={assignmentForm.due_date}
              onChange={(e) =>
                props.setAssignmentForm({
                  ...assignmentForm,
                  due_date: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Assignment notes"
              value={assignmentForm.notes}
              onChange={(e) =>
                props.setAssignmentForm({
                  ...assignmentForm,
                  notes: e.target.value,
                })
              }
            />

            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                Assign Form
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetAssignmentForm}
              >
                Clear
              </button>
            </div>
          </form>

          {formAssignments.length === 0 ? (
            <p className="empty-text">No form assignments yet.</p>
          ) : (
            <div className="tool-grid">
              {formAssignments.map((item) => (
                <div key={item.id} className="tool-card">
                  <div className="tool-card-top">
                    <h3>{item.form?.title || "Untitled Form"}</h3>
                    <span
                      className={`badge ${
                        item.status === "completed"
                          ? "success"
                          : item.status === "in_progress"
                            ? "warning"
                            : "neutral"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="tool-meta-list">
                    <p>
                      <strong>Employee:</strong>{" "}
                      {item.user?.full_name || item.user_id}
                    </p>
                    <p>
                      <strong>Due Date:</strong> {item.due_date || "â€”"}
                    </p>
                    <p>
                      <strong>Assigned:</strong>{" "}
                      {formatTimestamp(item.assigned_at)}
                    </p>
                    <p>
                      <strong>Completed:</strong>{" "}
                      {item.completed_at
                        ? formatTimestamp(item.completed_at)
                        : "â€”"}
                    </p>
                    <p>
                      <strong>Notes:</strong> {item.notes || "â€”"}
                    </p>
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        handleMarkAssignmentStatus(item, "in_progress")
                      }
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        handleMarkAssignmentStatus(item, "completed")
                      }
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      className="btn danger-button"
                      onClick={() => handleDeleteAssignment(item)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}

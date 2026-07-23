export default function renderDamagePage(props) {
  const {
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
  } = props;

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Damage Report</h2>
            <p>
              Search for an asset, select it, and submit a damage, defect, or
              missing-part report.
            </p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-bar-search">
            <input
              className="filter-search-input"
              type="text"
              placeholder="Search by name, asset tag, category, vehicle details, or location"
              value={damageSearch}
              onChange={(e) => setDamageSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Select Asset</h2>
            <p>{filteredDamageTools.length} assets match your search.</p>
          </div>
        </div>

        {filteredDamageTools.length === 0 ? (
          <p className="empty-text">No assets found.</p>
        ) : (
          <div className="tool-grid">
            {filteredDamageTools.map((tool) => {
              const isSelected = selectedDamageTool?.id === tool.id;

              return (
                <div key={tool.id} className="tool-card">
                  {tool.primary_photo_url && (
                    <img
                      src={tool.primary_photo_url}
                      alt={tool.name}
                      className="asset-image"
                    />
                  )}

                  <div className="tool-card-top">
                    <h3>{tool.name}</h3>
                    <span
                      className={`badge ${isSelected ? "warning" : "neutral"}`}
                    >
                      {isSelected ? "Selected" : tool.asset_type || "tool"}
                    </span>
                  </div>

                  <div className="tool-meta-list">
                    <p>
                      <strong>Category:</strong> {tool.category || "â€”"}
                    </p>
                    <p>
                      <strong>Asset Tag:</strong> {tool.asset_tag || "â€”"}
                    </p>
                    <p>
                      <strong>Condition:</strong> {tool.condition || "â€”"}
                    </p>
                    <p>
                      <strong>Location:</strong> {tool.location || "â€”"}
                    </p>
                    <p>
                      <strong>Damage Status:</strong>{" "}
                      {tool.damage_status || "none"}
                    </p>

                    {tool.asset_type === "vehicle" && (
                      <>
                        <p>
                          <strong>Make / Model:</strong>{" "}
                          {[tool.make, tool.model].filter(Boolean).join(" ") ||
                            "â€”"}
                        </p>
                        <p>
                          <strong>Plate:</strong> {tool.license_plate || "â€”"}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedDamageTool(tool);
                        resetDamageForm();
                      }}
                    >
                      {isSelected ? "Selected" : "Select Asset"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedDamageTool && (
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Report for {selectedDamageTool.name}</h2>
              <p>Submit the issue details for the selected asset.</p>
            </div>
          </div>

          <form className="tool-form" onSubmit={handleReportDamage}>
            <input
              placeholder="Title"
              value={damageForm.title}
              onChange={(e) =>
                setDamageForm({ ...damageForm, title: e.target.value })
              }
            />

            <select
              className="filter-control"
              value={damageForm.report_type}
              onChange={(e) =>
                setDamageForm({ ...damageForm, report_type: e.target.value })
              }
            >
              <option value="damage">Damage</option>
              <option value="defect">Defect</option>
              <option value="missing_part">Missing Part</option>
            </select>

            <select
              className="filter-control"
              value={damageForm.severity}
              onChange={(e) =>
                setDamageForm({ ...damageForm, severity: e.target.value })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <textarea
              placeholder="Description"
              value={damageForm.description}
              onChange={(e) =>
                setDamageForm({ ...damageForm, description: e.target.value })
              }
            />

            <label className="asset-upload-inline">
              <span>Damage Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setDamageForm({
                    ...damageForm,
                    photoFile: e.target.files?.[0] ?? null,
                  })
                }
              />
            </label>

            <div className="button-row">
              <button type="submit" className="btn btn-primary">
                Submit Report
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedDamageTool(null);
                  resetDamageForm();
                }}
              >
                Clear Selection
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Recent Damage Reports</h2>
            <p>Latest submitted reports across the system.</p>
          </div>
        </div>

        {damageReports.length === 0 ? (
          <p className="empty-text">No damage reports found.</p>
        ) : (
          <div className="tool-grid">
            {damageReports.slice(0, 12).map((report) => {
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
                      <strong>Asset:</strong> {tool?.name || report.tool_id}
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
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

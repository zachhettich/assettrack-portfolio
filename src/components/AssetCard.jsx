/*
  AssetCard.jsx
  ---------------------------------------
  Reusable asset display card.

  This file controls:
  - Displaying one tool or vehicle
  - Showing core asset info:
    - name
    - type
    - category
    - tag
    - condition
    - location
    - damage status
    - vehicle-specific details
    - notes
    - assigned user
    - primary photo
  - Showing action buttons depending on page context:
    - check out
    - check in
    - report damage
    - upload photo
    - delete asset
  - Reusable card UI for:
    - inventory
    - checkout
    - admin
*/

export default function AssetCard({
  tool,
  currentUserEmail,
  showActions = false,
  showDamageButton = false,
  showAdminControls = false,
  onCheckout,
  onCheckIn,
  onReportDamage,
  onPhotoFileChange,
  onUploadPhoto,
  onDelete,
}) {
  const checkedOutBy = tool.checked_out_by ?? tool.checkedoutby;
  const isHeldByCurrentUser = checkedOutBy === currentUserEmail;
  const isCheckedOut =
    tool.status === "checked_out" || tool.status === "checkedout";
  const canCheckOut = !isCheckedOut;
  const canCheckIn = isCheckedOut && isHeldByCurrentUser;

  return (
    <div className="tool-card">
      {tool.primary_photo_url ? (
        <img
          src={tool.primary_photo_url}
          alt={tool.name}
          className="asset-image"
        />
      ) : null}

      <div className="tool-card-top">
        <h3>{tool.name}</h3>
        <span className={`badge ${isCheckedOut ? "warning" : "success"}`}>
          {isCheckedOut ? "Checked Out" : "Available"}
        </span>
      </div>

      <div className="tool-meta-list">
        <p>
          <strong>Type:</strong> {tool.asset_type || "tool"}
        </p>
        <p>
          <strong>Category:</strong> {tool.category || "—"}
        </p>
        <p>
          <strong>Asset Tag:</strong> {tool.asset_tag || "—"}
        </p>
        <p>
          <strong>Condition:</strong> {tool.condition || "—"}
        </p>
        <p>
          <strong>Location:</strong> {tool.location || "—"}
        </p>
        <p>
          <strong>Damage Status:</strong> {tool.damage_status || "none"}
        </p>

        {tool.asset_type === "vehicle" ? (
          <>
            <p>
              <strong>Make / Model:</strong>{" "}
              {[tool.make, tool.model].filter(Boolean).join(" / ") || "—"}
            </p>
            <p>
              <strong>Year:</strong> {tool.year || "—"}
            </p>
            <p>
              <strong>Plate:</strong> {tool.license_plate || "—"}
            </p>
            <p>
              <strong>VIN:</strong> {tool.vin || "—"}
            </p>
            <p>
              <strong>Odometer:</strong> {tool.odometer || "—"}
            </p>
          </>
        ) : null}

        {checkedOutBy ? (
          <p>
            <strong>Held By:</strong> {checkedOutBy}
          </p>
        ) : null}

        {tool.notes ? (
          <p>
            <strong>Notes:</strong> {tool.notes}
          </p>
        ) : null}
      </div>

      {showActions || showDamageButton || showAdminControls ? (
        <div className="button-row">
          {showActions && canCheckOut ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onCheckout(tool)}
            >
              Check Out
            </button>
          ) : null}

          {showActions && canCheckIn ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onCheckIn(tool)}
            >
              Check In
            </button>
          ) : null}

          {showActions && isCheckedOut && !isHeldByCurrentUser ? (
            <button type="button" className="btn btn-secondary" disabled>
              Assigned to {checkedOutBy}
            </button>
          ) : null}

          {showDamageButton ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onReportDamage(tool)}
            >
              Report Damage
            </button>
          ) : null}

          {showAdminControls ? (
            <>
              <label className="asset-upload-inline">
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    onPhotoFileChange(tool.id, e.target.files?.[0] ?? null)
                  }
                />
              </label>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onUploadPhoto(tool)}
              >
                Upload Photo
              </button>

              <button
                type="button"
                className="btn danger-button"
                onClick={() => onDelete(tool)}
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

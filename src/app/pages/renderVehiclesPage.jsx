export default function renderVehiclesPage(props) {
  const {
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
  } = props;

  const selectedVehicleFuelLogs = selectedVehicle
    ? vehicleFuelLogs.filter((log) => log.tool_id === selectedVehicle.id)
    : [];

  const selectedVehicleMaintenanceLogs = selectedVehicle
    ? vehicleMaintenanceLogs.filter((log) => log.tool_id === selectedVehicle.id)
    : [];

  return (
    <>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>Vehicles</h2>
            <p>
              Select a vehicle to track fuel, maintenance, and damage history.
            </p>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <p className="empty-text">No vehicles found.</p>
        ) : (
          <div className="tool-grid">
            {vehicles.map((vehicle) => {
              const isSelected = selectedVehicle?.id === vehicle.id;

              return (
                <div key={vehicle.id} className="tool-card">
                  {vehicle.primary_photo_url ? (
                    <img
                      src={vehicle.primary_photo_url}
                      alt={vehicle.name}
                      className="asset-image"
                    />
                  ) : null}

                  <div className="tool-card-top">
                    <h3>{vehicle.name}</h3>
                    <span
                      className={`badge ${isSelected ? "warning" : "neutral"}`}
                    >
                      {isSelected ? "Selected" : "Vehicle"}
                    </span>
                  </div>

                  <div className="tool-meta-list">
                    <p>
                      <strong>Category:</strong> {vehicle.category || "—"}
                    </p>
                    <p>
                      <strong>Plate:</strong> {vehicle.license_plate || "—"}
                    </p>
                    <p>
                      <strong>Make / Model:</strong>{" "}
                      {[vehicle.make, vehicle.model]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </p>
                    <p>
                      <strong>Year:</strong> {vehicle.year || "—"}
                    </p>
                    <p>
                      <strong>KM:</strong> {vehicle.odometer ?? "—"}
                    </p>
                    <p>
                      <strong>Damage Status:</strong>{" "}
                      {vehicle.damage_status || "none"}
                    </p>
                    <p>
                      <strong>Location:</strong> {vehicle.location || "—"}
                    </p>
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setFuelForm((prev) => ({
                          ...prev,
                          toolId: vehicle.id,
                          driver_name: prev.driver_name || "",
                          odometer_km: vehicle.odometer ?? "",
                          fuel_type: prev.fuel_type ?? "Clear Diesel",
                        }));
                        setMaintenanceForm((prev) => ({
                          ...prev,
                          toolId: vehicle.id,
                          odometerKm: vehicle.odometer ?? "",
                        }));
                      }}
                    >
                      {isSelected ? "Selected" : "Select Vehicle"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedDamageTool(vehicle);
                        resetDamageForm();
                        setActivePage("damage");
                      }}
                    >
                      Report Damage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedVehicle ? (
        <>
          <section className="panel">
            <div className="section-head">
              <div>
                <h2>Fuel Log</h2>
                <p>Add a fuel entry for {selectedVehicle.name}.</p>
              </div>
            </div>

            <form className="tool-form" onSubmit={handleAddFuelLog}>
              <input
                type="date"
                value={fuelForm.entry_date}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, entry_date: e.target.value })
                }
                required
              />

              <input
                type="text"
                placeholder="Driver Name"
                value={fuelForm.driver_name}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, driver_name: e.target.value })
                }
              />

              <input
                type="number"
                placeholder="Truck KM"
                value={fuelForm.odometer_km}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, odometer_km: e.target.value })
                }
                required
              />

              <select
                className="filter-control"
                value={fuelForm.fuel_type}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, fuel_type: e.target.value })
                }
              >
                <option value="Clear Diesel">Clear Diesel</option>
                <option value="Coloured Diesel">Coloured Diesel</option>
                <option value="Hi Test Gas">Hi Test Gas</option>
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Fuel Pump Start Number"
                value={fuelForm.pump_start}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, pump_start: e.target.value })
                }
              />

              <input
                type="number"
                step="0.01"
                placeholder="Fuel Pump End Number"
                value={fuelForm.pump_end}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, pump_end: e.target.value })
                }
              />

              <textarea
                placeholder="Notes"
                value={fuelForm.notes}
                onChange={(e) =>
                  setFuelForm({ ...fuelForm, notes: e.target.value })
                }
              />

              <div className="button-row">
                <button type="submit" className="btn btn-primary">
                  Save Fuel Log
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <h2>Maintenance Log</h2>
                <p>Add service history for {selectedVehicle.name}.</p>
              </div>
            </div>

            <form className="tool-form" onSubmit={handleAddMaintenanceLog}>
              <input
                type="date"
                value={maintenanceForm.serviceDate}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    serviceDate: e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                placeholder="Truck KM"
                value={maintenanceForm.odometerKm}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    odometerKm: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Service Type"
                value={maintenanceForm.serviceType}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    serviceType: e.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Vendor"
                value={maintenanceForm.vendor}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    vendor: e.target.value,
                  })
                }
              />

              <input
                type="number"
                step="0.01"
                placeholder="Cost"
                value={maintenanceForm.cost}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    cost: e.target.value,
                  })
                }
              />

              <input
                type="date"
                value={maintenanceForm.nextServiceDueDate}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    nextServiceDueDate: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Next Service Due KM"
                value={maintenanceForm.nextServiceDueKm}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    nextServiceDueKm: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Description"
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    description: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Notes"
                value={maintenanceForm.notes}
                onChange={(e) =>
                  setMaintenanceForm({
                    ...maintenanceForm,
                    notes: e.target.value,
                  })
                }
              />

              <div className="button-row">
                <button type="submit" className="btn btn-primary">
                  Save Maintenance Log
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <h2>Recent Fuel Logs</h2>
                <p>Latest fuel entries for {selectedVehicle.name}.</p>
              </div>
            </div>

            {selectedVehicleFuelLogs.length === 0 ? (
              <p className="empty-text">No fuel logs found.</p>
            ) : (
              <div className="tool-grid">
                {selectedVehicleFuelLogs.map((log) => (
                  <div key={log.id} className="tool-card">
                    <div className="tool-meta-list">
                      <p>
                        <strong>Date:</strong> {log.entry_date || "—"}
                      </p>
                      <p>
                        <strong>Driver:</strong> {log.driver_name || "—"}
                      </p>
                      <p>
                        <strong>KM:</strong> {log.odometer_km ?? "—"}
                      </p>
                      <p>
                        <strong>Fuel Type:</strong> {log.fuel_type || "—"}
                      </p>
                      <p>
                        <strong>Pump Start:</strong> {log.pump_start ?? "—"}
                      </p>
                      <p>
                        <strong>Pump End:</strong> {log.pump_end ?? "—"}
                      </p>
                      <p>
                        <strong>Litres:</strong> {log.litres ?? "—"}
                      </p>
                      <p>
                        <strong>Notes:</strong> {log.notes || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <h2>Recent Maintenance Logs</h2>
                <p>Latest service entries for {selectedVehicle.name}.</p>
              </div>
            </div>

            {selectedVehicleMaintenanceLogs.length === 0 ? (
              <p className="empty-text">No maintenance logs found.</p>
            ) : (
              <div className="tool-grid">
                {selectedVehicleMaintenanceLogs.map((log) => (
                  <div key={log.id} className="tool-card">
                    <div className="tool-meta-list">
                      <p>
                        <strong>Date:</strong> {log.service_date || "—"}
                      </p>
                      <p>
                        <strong>Service Type:</strong> {log.service_type || "—"}
                      </p>
                      <p>
                        <strong>KM:</strong> {log.odometer_km ?? "—"}
                      </p>
                      <p>
                        <strong>Vendor:</strong> {log.vendor || "—"}
                      </p>
                      <p>
                        <strong>Cost:</strong> {log.cost ?? "—"}
                      </p>
                      <p>
                        <strong>Next Service Date:</strong>{" "}
                        {log.next_service_due_date || "—"}
                      </p>
                      <p>
                        <strong>Next Service KM:</strong>{" "}
                        {log.next_service_due_km ?? "—"}
                      </p>
                      <p>
                        <strong>Description:</strong> {log.description || "—"}
                      </p>
                      <p>
                        <strong>Notes:</strong> {log.notes || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}

import { supabase } from "../../lib/supabase";

export async function getVehicleFuelLogs() {
  const { data, error } = await supabase
    .from("vehicle_fuel_logs")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getVehicleMaintenanceLogs() {
  const { data, error } = await supabase
    .from("vehicle_maintenance_logs")
    .select("*")
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function addVehicleFuelLog({
  toolId,
  entryDate,
  driverName,
  odometerKm,
  fuelType,
  pumpStart,
  pumpEnd,
  notes,
  submittedBy,
}) {
  const startValue =
    pumpStart === "" || pumpStart === null || pumpStart === undefined
      ? null
      : Number(pumpStart);

  const endValue =
    pumpEnd === "" || pumpEnd === null || pumpEnd === undefined
      ? null
      : Number(pumpEnd);

  const litres =
    startValue !== null && endValue !== null && endValue >= startValue
      ? Number((endValue - startValue).toFixed(2))
      : null;

  const payload = {
    tool_id: Number(toolId),
    entry_date: entryDate,
    driver_name: driverName || null,
    odometer_km: Number(odometerKm),
    fuel_type: fuelType,
    pump_start: startValue,
    pump_end: endValue,
    litres,
    notes: notes?.trim() || null,
    submitted_by: submittedBy || null,
  };

  console.log("Fuel log payload being sent:", payload);
  const { data, error } = await supabase
    .from("vehicle_fuel_logs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function addVehicleMaintenanceLog({
  toolId,
  serviceDate,
  odometerKm,
  serviceType,
  description,
  vendor,
  cost,
  nextServiceDueDate,
  nextServiceDueKm,
  notes,
  submittedBy,
}) {
  const payload = {
    tool_id: Number(toolId),
    service_date: serviceDate,
    odometer_km:
      odometerKm === "" || odometerKm === null || odometerKm === undefined
        ? null
        : Number(odometerKm),
    service_type: serviceType.trim(),
    description: description?.trim() || null,
    vendor: vendor?.trim() || null,
    cost:
      cost === "" || cost === null || cost === undefined ? null : Number(cost),
    next_service_due_date: nextServiceDueDate || null,
    next_service_due_km:
      nextServiceDueKm === "" ||
      nextServiceDueKm === null ||
      nextServiceDueKm === undefined
        ? null
        : Number(nextServiceDueKm),
    notes: notes?.trim() || null,
    submitted_by: submittedBy || null,
  };

  const { data, error } = await supabase
    .from("vehicle_maintenance_logs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateVehicleOdometerIfHigher(toolId, nextOdometer) {
  if (
    nextOdometer === "" ||
    nextOdometer === null ||
    nextOdometer === undefined
  ) {
    return;
  }

  const numericOdometer = Number(nextOdometer);

  const { data: currentTool, error: fetchError } = await supabase
    .from("tools")
    .select("id, odometer")
    .eq("id", Number(toolId))
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const currentOdometer = Number(currentTool?.odometer || 0);

  if (numericOdometer > currentOdometer) {
    const { error: updateError } = await supabase
      .from("tools")
      .update({ odometer: numericOdometer })
      .eq("id", Number(toolId));

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

import DashboardPage from "../../pages/DashboardPage";

export default function renderDashboardPage(props) {
  const {
    tools,
    isAdmin,
    companyUpdates,
    notifications,
    formatTimestamp,
    fullName,
    sessionEmail,
    vehicleMaintenanceLogs,
    setActivePage,
  } = props;

  return (
    <DashboardPage
      tools={tools}
      isAdmin={isAdmin}
      companyUpdates={companyUpdates}
      notifications={notifications}
      formatTimestamp={formatTimestamp}
      fullName={fullName}
      sessionEmail={sessionEmail}
      vehicleMaintenanceLogs={vehicleMaintenanceLogs}
      setActivePage={setActivePage}
    />
  );
}

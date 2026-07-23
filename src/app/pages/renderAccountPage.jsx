import AccountPage from "../../pages/AccountPage";

export default function renderAccountPage(props) {
  const {
    session,
    profile,
    notifications,
    formAssignments,
    formatTimestamp,
    handleMarkAssignmentStatus,
    handleMarkNotificationRead,
    handleDeleteAccount,
  } = props;

  return (
    <AccountPage
      session={session}
      profile={profile}
      notifications={notifications}
      formAssignments={formAssignments}
      formatTimestamp={formatTimestamp}
      handleMarkAssignmentStatus={handleMarkAssignmentStatus}
      handleMarkNotificationRead={handleMarkNotificationRead}
      handleDeleteAccount={handleDeleteAccount}
    />
  );
}

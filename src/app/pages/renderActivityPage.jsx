export default function renderActivityPage(props) {
  const { activity, formatTimestamp } = props;

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Activity Log</h2>
          <p>Timestamped history of movement, uploads, and admin actions.</p>
        </div>
      </div>

      {activity.length === 0 ? (
        <p className="empty-text">No activity yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item) => (
                <tr key={item.id}>
                  <td>{item.action}</td>
                  <td>{item.user_email || "â€”"}</td>
                  <td>{item.details || "â€”"}</td>
                  <td>{formatTimestamp(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

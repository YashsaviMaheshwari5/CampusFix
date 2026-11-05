export default function StaffSidebar({
  activeFilter,
  setActiveFilter,
  onLogout,
  user,
  totalCount = 0,
  pendingCount = 0,
}) {
  const initials = (user?.name || "Staff")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="staff-sidebar">
      <div className="staff-brand-box">
        <div className="staff-logo-icon">🛠️</div>
        <div>
          <h2>CampusFix</h2>
          <span className="staff-portal-badge">Staff Portal</span>
        </div>
      </div>

      <nav className="staff-nav">
        <div className="nav-group-label">WORKSPACE</div>

        <button
          type="button"
          className={`staff-nav-item ${activeFilter === "All" ? "active" : ""}`}
          onClick={() => setActiveFilter("All")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
          <span className="nav-badge">{totalCount}</span>
        </button>

        <div className="nav-group-label">OVERVIEW</div>

        <div className="staff-sidebar-summary">
          <button
            type="button"
            className="summary-row"
            onClick={() => setActiveFilter("Pending")}
          >
            <span>Pending complaints</span>
            <strong>{pendingCount}</strong>
          </button>

          <button
            type="button"
            className="summary-row"
            onClick={() => setActiveFilter("All")}
          >
            <span>Total complaints</span>
            <strong>{totalCount}</strong>
          </button>
        </div>
      </nav>

      <div className="staff-sidebar-footer">
        <div className="staff-user-info">
          <div className="staff-avatar">{initials}</div>

          <div className="staff-user-meta">
            <strong>{user?.name || "Staff Member"}</strong>
            <span>{user?.email || "staff@campusfix.edu"}</span>
            <span className="role-tag">
              {user?.role?.toUpperCase() || "STAFF"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="staff-logout-btn"
          onClick={onLogout}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
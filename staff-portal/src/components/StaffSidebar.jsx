export default function StaffSidebar({
  activeFilter,
  setActiveFilter,
  onLogout,
  user,
  totalCount = 0,
  pendingCount = 0,
}) {
  return (
    <aside className="staff-sidebar">
      <div className="staff-brand-box">
        <div className="staff-logo-icon">🛠️</div>
        <div>
          <h2>CampusFix</h2>
          <span className="staff-portal-badge">Staff Operations Portal</span>
        </div>
      </div>

      <nav className="staff-nav">
        <div className="nav-group-label">OPERATIONS</div>

        <button
          type="button"
          className={`staff-nav-item ${activeFilter === "All" ? "active" : ""}`}
          onClick={() => setActiveFilter("All")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">All Complaints</span>
          <span className="nav-badge">{totalCount}</span>
        </button>

        <button
          type="button"
          className={`staff-nav-item ${activeFilter === "Pending" ? "active" : ""}`}
          onClick={() => setActiveFilter("Pending")}
        >
          <span className="nav-icon">⏳</span>
          <span className="nav-label">Pending Review</span>
          {pendingCount > 0 && <span className="nav-badge alert">{pendingCount}</span>}
        </button>

        <button
          type="button"
          className={`staff-nav-item ${activeFilter === "In Progress" ? "active" : ""}`}
          onClick={() => setActiveFilter("In Progress")}
        >
          <span className="nav-icon">🔧</span>
          <span className="nav-label">In Progress</span>
        </button>

        <button
          type="button"
          className={`staff-nav-item ${activeFilter === "Resolved" ? "active" : ""}`}
          onClick={() => setActiveFilter("Resolved")}
        >
          <span className="nav-icon">✅</span>
          <span className="nav-label">Resolved Issues</span>
        </button>

        <button
          type="button"
          className={`staff-nav-item ${activeFilter === "Rejected" ? "active" : ""}`}
          onClick={() => setActiveFilter("Rejected")}
        >
          <span className="nav-icon">🚫</span>
          <span className="nav-label">Rejected</span>
        </button>

        <div className="nav-group-label" style={{ marginTop: "20px" }}>EXTERNAL</div>

        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="staff-nav-item external-link"
        >
          <span className="nav-icon">🎓</span>
          <span className="nav-label">Student Portal</span>
          <span className="nav-arrow">↗</span>
        </a>
      </nav>

      <div className="staff-sidebar-footer">
        <div className="staff-user-info">
          <div className="staff-avatar">
            {(user?.name || "Staff")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="staff-user-meta">
            <strong>{user?.name || "Staff Member"}</strong>
            <span>{user?.email || "staff@campusfix.edu"}</span>
            <span className="role-tag">ROLE: {user?.role?.toUpperCase() || "STAFF"}</span>
          </div>
        </div>

        <button type="button" className="staff-logout-btn" onClick={onLogout}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}


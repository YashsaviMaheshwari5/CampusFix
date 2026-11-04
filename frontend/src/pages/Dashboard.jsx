import { useEffect, useState } from "react";
import { complaintService } from "../services/complaintService";

function Dashboard({ complaints, onSelectComplaint, onNavigate, user }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serverStats, setServerStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    complaintService.stats(controller.signal)
      .then(setServerStats)
      .catch((error) => { if (error.name !== "AbortError") setStatsError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setStatsLoading(false); });
    return () => controller.abort();
  }, [complaints]);

  // Logged-in student's name
  const rawName = user?.name === "Campus Staff Coordinator" ? "Student" : (user?.name || localStorage.getItem("userName") || "Student");
  const userName = rawName;
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Search complaints by title, location, category
  const searchLower = search.trim().toLowerCase();
  const searchResults = complaints.filter((complaint) => {
    if (!searchLower) return true;
    return (
      (complaint.title || "").toLowerCase().includes(searchLower) ||
      (complaint.location || "").toLowerCase().includes(searchLower) ||
      (complaint.category || "").toLowerCase().includes(searchLower)
    );
  });

  // Filter complaints
  const filteredComplaints = searchResults.filter((complaint) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Submitted") return ["Submitted", "Pending"].includes(complaint.status);
    return complaint.status === statusFilter;
  });

  // Sort by priority
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
  });

  // Statistics calculation for student issues
  const totalComplaints = serverStats?.total ?? complaints.length;
  const resolvedComplaints = serverStats?.resolved ?? complaints.filter((c) => c.status === "Resolved").length;
  const progressComplaints = serverStats
    ? (serverStats.inProgress + serverStats.acknowledged)
    : complaints.filter((c) => ["In Progress", "Acknowledged"].includes(c.status)).length;
  const pendingComplaints = serverStats
    ? serverStats.submitted
    : complaints.filter((c) => ["Submitted", "Pending"].includes(c.status)).length;
  const rejectedComplaints = serverStats?.rejected ?? complaints.filter((c) => c.status === "Rejected").length;

  return (
    <div className="dashboard">
      {/* ==================================
          STUDENT HEADER
      ================================== */}
      <div className="dashboard-header">
        <div>
          <span className="dashboard-label">
            CAMPUSFIX STUDENT PORTAL
          </span>

          <h1>
            Welcome back, {userName}! 👋
          </h1>

          <p>
            Track your campus complaints and view real-time status updates from staff.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {onNavigate && (
            <button
              type="button"
              className="submit-btn"
              onClick={() => onNavigate("report")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                borderRadius: "8px"
              }}
            >
              <span>📝</span> Report Issue
            </button>
          )}

          <div className="profile">
            <div
              className="notification-bell"
              onClick={() => onNavigate?.("notifications")}
              style={{ cursor: "pointer" }}
              title="Notifications"
            >
              🔔
            </div>

            <div className="profile-avatar">
              {initials || "ST"}
            </div>

            <div className="profile-info">
              <strong>{userName}</strong>
              <span>Student</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================
          STUDENT METRIC CARDS
      ================================== */}
      <div className="stats">
        {statsLoading && <p role="status">Loading dashboard statistics…</p>}
        {statsError && <p role="alert">{statsError}</p>}

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div>
            <p>Total Complaints</p>
            <h2>{totalComplaints}</h2>
            <span>All your reported issues</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div>
            <p>Pending Review</p>
            <h2>{pendingComplaints}</h2>
            <span>Awaiting staff review</span>
          </div>
        </div>

        <div className="stat-card progress">
          <div className="stat-icon">🔧</div>
          <div>
            <p>In Progress</p>
            <h2>{progressComplaints}</h2>
            <span>Assigned to staff</span>
          </div>
        </div>

        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div>
            <p>Resolved</p>
            <h2>{resolvedComplaints}</h2>
            <span>Successfully fixed</span>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">🚫</div>
          <div>
            <p>Rejected</p>
            <h2>{rejectedComplaints}</h2>
            <span>Reviewed & closed</span>
          </div>
        </div>
      </div>

      {/* ==================================
          RECENT COMPLAINTS
      ================================== */}
      <div className="recent-section">
        <div className="section-header">
          <div>
            <h2>My Recent Complaints</h2>
            <p className="section-subtitle">
              Click any complaint to view its full details and staff resolution history.
            </p>
          </div>

          <input
            type="text"
            placeholder="🔍 Search my complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-box"
          />
        </div>

        {/* Filters */}
        <div className="status-filters">
          {["All", "Submitted", "Acknowledged", "In Progress", "Resolved", "Rejected"].map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? "active-filter" : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Complaints List */}
        <div className="complaints-list">
          {sortedComplaints.length === 0 ? (
            <div className="no-results" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div className="empty-icon" style={{ fontSize: "36px", marginBottom: "12px" }}>
                {search ? "🔍" : "📋"}
              </div>
              <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>
                {search || statusFilter !== "All"
                  ? "No matching complaints found"
                  : "You haven't reported any issues yet"}
              </h3>
              <p style={{ color: "#777", fontSize: "14px", marginBottom: "16px" }}>
                {search || statusFilter !== "All"
                  ? "Try adjusting your search query or status filter."
                  : "Notice a broken light, plumbing leak, or internet issue on campus? Report it now."}
              </p>
              {!search && statusFilter === "All" && onNavigate && (
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => onNavigate("report")}
                  style={{ display: "inline-block", padding: "10px 20px", fontSize: "14px", borderRadius: "8px" }}
                >
                  📝 Report an Issue Now
                </button>
              )}
            </div>
          ) : (
            sortedComplaints.map((complaint) => (
              <div
                className="complaint-card"
                key={complaint._id || complaint.id || complaint.title}
                onClick={() => onSelectComplaint(complaint)}
              >
                <div className="complaint-icon">
                  {complaint.category === "Internet"
                    ? "📶"
                    : complaint.category === "Electricity"
                    ? "⚡"
                    : complaint.category === "Water"
                    ? "💧"
                    : complaint.category === "Cleanliness"
                    ? "🧹"
                    : "🔧"}
                </div>

                <div className="complaint-info">
                  <h3>{complaint.title}</h3>
                  <p>📍 {complaint.location}</p>
                  <div className="complaint-meta">
                    <span>{complaint.category || "Maintenance"}</span>
                    <span>Priority: {complaint.priority}</span>
                    {complaint.createdAt && (
                      <span>
                        📅 {new Date(complaint.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="complaint-status">
                  <span
                    className={
                      complaint.status === "Resolved"
                        ? "resolved-badge"
                        : complaint.status === "Rejected"
                        ? "rejected-badge"
                        : ["Submitted", "Pending"].includes(complaint.status)
                        ? "pending-badge"
                        : "progress-badge"
                    }
                  >
                    {complaint.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

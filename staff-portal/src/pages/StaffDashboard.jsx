import { useState, useMemo } from "react";
import { getAllowedStatusTransitions } from "../utils/complaintStatus.js";

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "just now";
  } catch {
    return "";
  }
}

const categoryIcons = {
  Internet: "📶",
  Electricity: "⚡",
  Water: "💧",
  Cleanliness: "🧹",
  Maintenance: "🔧",
  Other: "📌",
};

export default function StaffDashboard({
  complaints,
  stats,
  onSelectComplaint,
  onOpenUpdateModal,
  onRefresh,
  refreshing,
  lastRefreshed,
  statusFilter,
  setStatusFilter,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("table");

  // Filtering
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const sName = c.submittedBy?.name?.toLowerCase() || "";
        const sEmail = c.submittedBy?.email?.toLowerCase() || "";
        const title = c.title?.toLowerCase() || "";
        const desc = c.description?.toLowerCase() || "";
        const loc = c.location?.toLowerCase() || "";
        const cat = c.category?.toLowerCase() || "";

        if (
          !title.includes(q) &&
          !desc.includes(q) &&
          !loc.includes(q) &&
          !cat.includes(q) &&
          !sName.includes(q) &&
          !sEmail.includes(q)
        ) {
          return false;
        }
      }

      if (statusFilter !== "All") {
        if (statusFilter === "Pending") {
          if (!["Submitted", "Acknowledged", "Pending"].includes(c.status)) return false;
        } else if (c.status !== statusFilter) {
          return false;
        }
      }

      if (categoryFilter !== "All" && c.category !== categoryFilter) return false;
      if (priorityFilter !== "All" && c.priority !== priorityFilter) return false;

      return true;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...filtered];
    const weight = { High: 3, Medium: 2, Low: 1 };

    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "priorityHigh") {
        const diff = (weight[b.priority] || 0) - (weight[a.priority] || 0);
        return diff !== 0 ? diff : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "priorityLow") {
        const diff = (weight[a.priority] || 0) - (weight[b.priority] || 0);
        return diff !== 0 ? diff : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });

    return list;
  }, [filtered, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setPriorityFilter("All");
    setSortBy("newest");
  };

  const hasFilters =
    search || statusFilter !== "All" || categoryFilter !== "All" || priorityFilter !== "All" || sortBy !== "newest";

  const getStatusBadge = (st) => {
    if (st === "Resolved") return <span className="status-badge b-resolved">✅ Resolved</span>;
    if (st === "In Progress") return <span className="status-badge b-progress">🔧 In Progress</span>;
    if (st === "Acknowledged") return <span className="status-badge b-ack">👁️ Acknowledged</span>;
    if (st === "Rejected") return <span className="status-badge b-rejected">🚫 Rejected</span>;
    return <span className="status-badge b-pending">⏳ Pending Review</span>;
  };

  const getPriorityBadge = (p) => {
    if (p === "High") return <span className="priority-pill p-high">🔥 High</span>;
    if (p === "Medium") return <span className="priority-pill p-med">⚡ Medium</span>;
    return <span className="priority-pill p-low">🟢 Low</span>;
  };

  return (
    <div className="staff-dashboard-content">
      {/* Top Banner */}
      <div className="dashboard-top-bar">
        <div>
          <div className="top-eyebrow">
            <span className="live-pill">
              <span className="pulsing-circle"></span> Live MongoDB Feed
            </span>
            <span className="port-badge">PORT 5174 (STAFF)</span>
          </div>
          <h1>Student Complaints Dashboard</h1>
          <p className="page-desc">
            Real-time feed of all issues reported by students from CampusFix Student Portal.
          </p>
        </div>

        <div className="top-bar-right">
          <button
            type="button"
            className="refresh-btn"
            onClick={onRefresh}
            disabled={refreshing}
            title="Fetch latest complaints from database"
          >
            <span className={refreshing ? "spin" : ""}>↻</span>
            {refreshing ? "Refreshing…" : "Sync Database"}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="stats-row">
        <div
          className={`metric-card ${statusFilter === "All" ? "selected" : ""}`}
          onClick={() => setStatusFilter("All")}
        >
          <div className="card-icon ic-total">📋</div>
          <div>
            <span className="m-label">Total Complaints</span>
            <h2 className="m-val">{stats.total}</h2>
            <span className="m-sub">All student submissions</span>
          </div>
        </div>

        <div
          className={`metric-card ${statusFilter === "Pending" ? "selected" : ""}`}
          onClick={() => setStatusFilter("Pending")}
        >
          <div className="card-icon ic-pending">⏳</div>
          <div>
            <span className="m-label">Pending Action</span>
            <h2 className="m-val">{stats.pending}</h2>
            <span className="m-sub">Awaiting review</span>
          </div>
        </div>

        <div
          className={`metric-card ${statusFilter === "In Progress" ? "selected" : ""}`}
          onClick={() => setStatusFilter("In Progress")}
        >
          <div className="card-icon ic-progress">🔧</div>
          <div>
            <span className="m-label">Under Progress</span>
            <h2 className="m-val">{stats.inProgress}</h2>
            <span className="m-sub">Assigned to team</span>
          </div>
        </div>

        <div
          className={`metric-card ${statusFilter === "Resolved" ? "selected" : ""}`}
          onClick={() => setStatusFilter("Resolved")}
        >
          <div className="card-icon ic-resolved">✅</div>
          <div>
            <span className="m-label">Resolved</span>
            <h2 className="m-val">{stats.resolved}</h2>
            <span className="m-sub">Completed & fixed</span>
          </div>
        </div>

        <div
          className={`metric-card ${statusFilter === "Rejected" ? "selected" : ""}`}
          onClick={() => setStatusFilter("Rejected")}
        >
          <div className="card-icon ic-rejected">🚫</div>
          <div>
            <span className="m-label">Rejected</span>
            <h2 className="m-val">{stats.rejected}</h2>
            <span className="m-sub">Declined / Closed</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="controls-panel">
        <div className="search-wrap">
          <span className="search-symbol">🔍</span>
          <input
            type="text"
            placeholder="Search by title, student name, email, location, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filters-row">
          <div className="filter-select-group">
            <label htmlFor="f-status">Status</label>
            <select
              id="f-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Review</option>
              <option value="Submitted">Submitted</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-select-group">
            <label htmlFor="f-category">Category</label>
            <select
              id="f-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Maintenance">🔧 Maintenance</option>
              <option value="Cleanliness">🧹 Cleanliness</option>
              <option value="Electricity">⚡ Electricity</option>
              <option value="Internet">📶 Internet</option>
              <option value="Water">💧 Water</option>
              <option value="Other">📌 Other</option>
            </select>
          </div>

          <div className="filter-select-group">
            <label htmlFor="f-priority">Priority</label>
            <select
              id="f-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          <div className="filter-select-group">
            <label htmlFor="f-sort">Sort Order</label>
            <select
              id="f-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priorityHigh">Priority: High → Low</option>
              <option value="priorityLow">Priority: Low → High</option>
            </select>
          </div>

          <div className="view-mode-toggle">
            <button
              type="button"
              className={viewMode === "table" ? "active" : ""}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              📋 Table
            </button>
            <button
              type="button"
              className={viewMode === "cards" ? "active" : ""}
              onClick={() => setViewMode("cards")}
              title="Card View"
            >
              🔲 Cards
            </button>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="reset-filters-btn"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="results-info-row">
        <span>
          Showing <strong>{sorted.length}</strong> of <strong>{complaints.length}</strong> complaints
          {hasFilters && " (Filtered)"}
        </span>
        <span className="sync-note">
          Synced with MongoDB: {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* Complaints Presentation */}
      {sorted.length === 0 ? (
        <div className="no-data-card">
          <div className="no-data-icon">🔍</div>
          <h3>No student complaints found</h3>
          <p>
            {hasFilters
              ? "No complaints match your active filter criteria."
              : "No complaints found in MongoDB. Any issue submitted through CampusFix Student Portal (Port 5173) will automatically show up here."}
          </p>
          {hasFilters && (
            <button type="button" className="btn btn-primary" onClick={resetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="table-responsive-container">
          <table className="staff-data-table">
            <thead>
              <tr>
                <th style={{ width: "26%" }}>Complaint & Description</th>
                <th style={{ width: "13%" }}>Category</th>
                <th style={{ width: "16%" }}>Location</th>
                <th style={{ width: "18%" }}>Student Details</th>
                <th style={{ width: "11%" }}>Priority</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "6%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => {
                const sName = item.submittedBy?.name || "Student";
                const sEmail = item.submittedBy?.email || "N/A";
                const allowedTransitions = getAllowedStatusTransitions(item.status);

                return (
                  <tr
                    key={item._id}
                    className="clickable-row"
                    onClick={() => onSelectComplaint(item)}
                  >
                    <td>
                      <div className="issue-text-wrap">
                        <strong className="issue-title">{item.title}</strong>
                        <p className="issue-desc-short">{item.description}</p>
                        <span className="issue-time-sub">
                          📅 {formatDate(item.createdAt)} · {timeAgo(item.createdAt)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="cat-badge">
                        <span>{categoryIcons[item.category] || "🔧"}</span>
                        {item.category}
                      </span>
                    </td>

                    <td>
                      <span className="loc-text">📍 {item.location}</span>
                    </td>

                    <td>
                      <div className="student-info-cell">
                        <div className="student-initials-bubble">
                          {sName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="student-meta">
                          <strong className="student-name">{sName}</strong>
                          <span className="student-email" title={sEmail}>
                            {sEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{getPriorityBadge(item.priority)}</td>

                    <td>{getStatusBadge(item.status)}</td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row-action-btns">
                        <button
                          type="button"
                          className="btn-tbl-view"
                          onClick={() => onSelectComplaint(item)}
                          title="View complete complaint details"
                        >
                          👁️ View
                        </button>
                        {allowedTransitions.length > 0 && (
                          <button
                            type="button"
                            className="btn-tbl-update"
                            onClick={() => onOpenUpdateModal(item)}
                            title="Update complaint status"
                          >
                            ⚡ Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="cards-responsive-grid">
          {sorted.map((item) => {
            const sName = item.submittedBy?.name || "Student";
            const sEmail = item.submittedBy?.email || "N/A";
            const allowedTransitions = getAllowedStatusTransitions(item.status);

            return (
              <div
                key={item._id}
                className="complaint-item-card"
                onClick={() => onSelectComplaint(item)}
              >
                <div className="card-head">
                  <span className="cat-badge">
                    <span>{categoryIcons[item.category] || "🔧"}</span>
                    {item.category}
                  </span>
                  <div className="card-top-badges">
                    {getPriorityBadge(item.priority)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                <div className="card-middle">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>

                <div className="card-loc-date">
                  <span>📍 {item.location}</span>
                  <span>📅 {formatDate(item.createdAt)} ({timeAgo(item.createdAt)})</span>
                </div>

                <div className="card-student-strip">
                  <div className="student-initials-bubble">
                    {sName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <span className="submitter-label">Student:</span>
                    <strong className="student-name">{sName}</strong>
                    <span className="student-email">{sEmail}</span>
                  </div>
                </div>

                <div className="card-buttons-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onSelectComplaint(item)}
                  >
                    👁️ View Details
                  </button>
                  {allowedTransitions.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onOpenUpdateModal(item)}
                    >
                      ⚡ Update Status
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo, useCallback } from "react";
import { complaintService, updateStatusAndRefresh } from "../services/complaintService";
import { getAllowedStatusTransitions } from "../utils/complaintStatus.js";

// Helper for formatting date
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

// Helper for relative time
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

// Category icons
const categoryIcons = {
  Internet: "📶",
  Electricity: "⚡",
  Water: "💧",
  Cleanliness: "🧹",
  Maintenance: "🔧",
  Other: "📌",
};

export default function StaffDashboard({
  complaints = [],
  onSelectComplaint,
  user,
  onComplaintUpdated,
  onRefresh,
}) {
  const [serverStats, setServerStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'

  // Quick Status Update Modal state
  const [updatingComplaint, setUpdatingComplaint] = useState(null);
  const [targetStatus, setTargetStatus] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Refresh handler
  const refreshData = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const [statsRes] = await Promise.allSettled([
        complaintService.stats(),
        onRefresh ? onRefresh() : Promise.resolve(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setServerStats(statsRes.value);
      }
      setLastRefreshed(new Date());
    } finally {
      if (!isBackground) setRefreshing(false);
    }
  }, [onRefresh]);

  // Initial stats fetch and auto-polling interval
  useEffect(() => {
    let active = true;
    complaintService.stats()
      .then((st) => {
        if (active) setServerStats(st);
      })
      .catch(() => {});

    const intervalId = setInterval(() => {
      refreshData(true);
    }, 12000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [refreshData]);

  // Dismiss toast after 4s
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(""), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = serverStats?.total ?? complaints.length;
    const resolved =
      serverStats?.resolved ??
      complaints.filter((c) => c.status === "Resolved").length;
    const inProgress =
      serverStats?.inProgress ??
      complaints.filter((c) => c.status === "In Progress").length;
    const pending =
      serverStats
        ? (serverStats.submitted || 0) + (serverStats.acknowledged || 0)
        : complaints.filter((c) =>
            ["Submitted", "Acknowledged", "Pending"].includes(c.status)
          ).length;
    const rejected =
      serverStats?.rejected ??
      complaints.filter((c) => c.status === "Rejected").length;

    return { total, pending, inProgress, resolved, rejected };
  }, [serverStats, complaints]);

  // Filter and search complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      // Search match
      if (search.trim()) {
        const q = search.toLowerCase();
        const studentName = complaint.submittedBy?.name?.toLowerCase() || "";
        const studentEmail = complaint.submittedBy?.email?.toLowerCase() || "";
        const title = complaint.title?.toLowerCase() || "";
        const desc = complaint.description?.toLowerCase() || "";
        const loc = complaint.location?.toLowerCase() || "";
        const cat = complaint.category?.toLowerCase() || "";

        const matches =
          title.includes(q) ||
          desc.includes(q) ||
          loc.includes(q) ||
          cat.includes(q) ||
          studentName.includes(q) ||
          studentEmail.includes(q);

        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== "All") {
        if (statusFilter === "Pending") {
          if (!["Submitted", "Acknowledged", "Pending"].includes(complaint.status)) {
            return false;
          }
        } else if (complaint.status !== statusFilter) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "All" && complaint.category !== categoryFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "All" && complaint.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  // Sorted complaints
  const sortedComplaints = useMemo(() => {
    const list = [...filteredComplaints];
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };

    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "priorityHigh") {
        const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        return diff !== 0 ? diff : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "priorityLow") {
        const diff = (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        return diff !== 0 ? diff : new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });

    return list;
  }, [filteredComplaints, sortBy]);

  // Open Quick Update Modal
  const openQuickUpdate = (complaint, e) => {
    e?.stopPropagation();
    setUpdatingComplaint(complaint);
    const allowed = getAllowedStatusTransitions(complaint.status);
    setTargetStatus(allowed[0] || "");
    setUpdateNote("");
    setModalError("");
  };

  // Submit Quick Status Update
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!updatingComplaint || !targetStatus || modalSaving) return;

    setModalSaving(true);
    setModalError("");

    try {
      const result = await updateStatusAndRefresh(updatingComplaint._id, {
        status: targetStatus,
        note: updateNote.trim(),
      });

      const updated = result.complaint;

      // Notify parent app
      onComplaintUpdated?.(updated);

      setToastMessage(
        `✓ Complaint "${updated.title}" status updated to ${updated.status}.`
      );
      setUpdatingComplaint(null);

      // Refresh stats
      complaintService.stats().then(setServerStats).catch(() => {});
    } catch (err) {
      setModalError(err.message || "Failed to update complaint status.");
    } finally {
      setModalSaving(false);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setPriorityFilter("All");
    setSortBy("newest");
  };

  const hasActiveFilters =
    search || statusFilter !== "All" || categoryFilter !== "All" || priorityFilter !== "All" || sortBy !== "newest";

  // Badges helper
  const getStatusBadge = (status) => {
    if (status === "Resolved") {
      return <span className="status-badge badge-resolved">✅ Resolved</span>;
    }
    if (status === "In Progress") {
      return <span className="status-badge badge-progress">🔧 In Progress</span>;
    }
    if (status === "Acknowledged") {
      return <span className="status-badge badge-ack">👁️ Acknowledged</span>;
    }
    if (status === "Rejected") {
      return <span className="status-badge badge-rejected">🚫 Rejected</span>;
    }
    return <span className="status-badge badge-pending">⏳ Pending Review</span>;
  };

  const getPriorityBadge = (priority) => {
    if (priority === "High") {
      return <span className="priority-pill priority-high">🔥 High</span>;
    }
    if (priority === "Medium") {
      return <span className="priority-pill priority-medium">⚡ Medium</span>;
    }
    return <span className="priority-pill priority-low">🟢 Low</span>;
  };

  return (
    <div className="staff-dashboard">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="staff-toast" role="status">
          {toastMessage}
        </div>
      )}

      {/* =========================================================
          HEADER SECTION
          ========================================================= */}
      <div className="staff-header">
        <div>
          <div className="staff-header-eyebrow">
            <span className="staff-role-tag">🛠️ Staff Operations Center</span>
            <span className="live-pulse-indicator">
              <span className="pulse-dot"></span> Live Sync Active
            </span>
          </div>
          <h1>Staff Management Dashboard</h1>
          <p>
            Review, track, and manage all student complaints raised across campus.
          </p>
        </div>

        <div className="staff-header-actions">
          <button
            type="button"
            className="staff-btn staff-btn-refresh"
            onClick={() => refreshData(false)}
            disabled={refreshing}
            title="Fetch latest student complaints from database"
          >
            <span className={refreshing ? "spin-icon" : ""}>↻</span>
            {refreshing ? "Refreshing…" : "Refresh Data"}
          </button>

          <div className="staff-user-card">
            <div className="staff-user-avatar">
              {(user?.name || "Staff")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="staff-user-details">
              <strong>{user?.name || "Staff Member"}</strong>
              <span>{user?.email || "staff@campusfix.edu"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          STATISTICS OVERVIEW CARDS (Requirement 6)
          ========================================================= */}
      <div className="staff-stats-grid">
        {/* Total Complaints */}
        <div
          className={`staff-stat-card total ${statusFilter === "All" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("All")}
          title="Click to view all complaints"
        >
          <div className="stat-card-icon">📋</div>
          <div className="stat-card-body">
            <span className="stat-label">Total Complaints</span>
            <h2 className="stat-number">{stats.total}</h2>
            <span className="stat-hint">All raised issues</span>
          </div>
        </div>

        {/* Pending Review */}
        <div
          className={`staff-stat-card pending ${statusFilter === "Pending" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("Pending")}
          title="Click to filter pending complaints"
        >
          <div className="stat-card-icon">⏳</div>
          <div className="stat-card-body">
            <span className="stat-label">Pending Review</span>
            <h2 className="stat-number">{stats.pending}</h2>
            <span className="stat-hint">Requires action</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          className={`staff-stat-card in-progress ${statusFilter === "In Progress" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("In Progress")}
          title="Click to filter in-progress complaints"
        >
          <div className="stat-card-icon">🔧</div>
          <div className="stat-card-body">
            <span className="stat-label">In Progress</span>
            <h2 className="stat-number">{stats.inProgress}</h2>
            <span className="stat-hint">Under active fix</span>
          </div>
        </div>

        {/* Resolved */}
        <div
          className={`staff-stat-card resolved ${statusFilter === "Resolved" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("Resolved")}
          title="Click to filter resolved complaints"
        >
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-body">
            <span className="stat-label">Resolved</span>
            <h2 className="stat-number">{stats.resolved}</h2>
            <span className="stat-hint">Successfully fixed</span>
          </div>
        </div>

        {/* Rejected */}
        <div
          className={`staff-stat-card rejected ${statusFilter === "Rejected" ? "stat-card-active" : ""}`}
          onClick={() => setStatusFilter("Rejected")}
          title="Click to filter rejected complaints"
        >
          <div className="stat-card-icon">🚫</div>
          <div className="stat-card-body">
            <span className="stat-label">Rejected</span>
            <h2 className="stat-number">{stats.rejected}</h2>
            <span className="stat-hint">Closed / Invalid</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          SEARCH & FILTER TOOLBAR (Requirement 5)
          ========================================================= */}
      <div className="staff-toolbar">
        {/* Search */}
        <div className="staff-search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="staff-search-input"
            placeholder="Search by title, student, location, category, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="staff-filter-group">
          {/* Status Filter */}
          <div className="filter-item">
            <label htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
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

          {/* Category Filter */}
          <div className="filter-item">
            <label htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
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

          {/* Priority Filter */}
          <div className="filter-item">
            <label htmlFor="filter-priority">Priority</label>
            <select
              id="filter-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="filter-item">
            <label htmlFor="filter-sort">Sort</label>
            <select
              id="filter-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priorityHigh">Priority: High → Low</option>
              <option value="priorityLow">Priority: Low → High</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="view-toggle-group">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              📋 Table
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Cards View"
            >
              🔲 Cards
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="staff-btn staff-btn-reset"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="staff-results-header">
        <span className="results-count">
          Showing <strong>{sortedComplaints.length}</strong> of{" "}
          <strong>{complaints.length}</strong> complaints
          {hasActiveFilters && " (Filtered)"}
        </span>
        <span className="last-sync-tag">
          Last synced: {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* =========================================================
          COMPLAINTS DISPLAY (Requirements 1, 2, 3, 4)
          ========================================================= */}
      {sortedComplaints.length === 0 ? (
        <div className="staff-empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No complaints found</h3>
          <p>
            {hasActiveFilters
              ? "No student complaints matched your search or filters. Try adjusting them."
              : "No complaints have been submitted yet. Any complaints raised by students will automatically show up here."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="staff-btn staff-btn-primary"
              onClick={resetFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* ======================== TABLE VIEW ======================== */
        <div className="staff-table-container">
          <table className="staff-complaints-table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Complaint Title & Details</th>
                <th style={{ width: "13%" }}>Category</th>
                <th style={{ width: "16%" }}>Location</th>
                <th style={{ width: "18%" }}>Student Details</th>
                <th style={{ width: "11%" }}>Priority</th>
                <th style={{ width: "12%" }}>Status</th>
                <th style={{ width: "6%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedComplaints.map((item) => {
                const studentName = item.submittedBy?.name || "Student";
                const studentEmail = item.submittedBy?.email || "N/A";
                const allowedTransitions = getAllowedStatusTransitions(item.status);

                return (
                  <tr
                    key={item._id}
                    className="staff-table-row"
                    onClick={() => onSelectComplaint(item)}
                    title="Click row to view complete complaint details"
                  >
                    {/* Title & Preview */}
                    <td className="col-title">
                      <div className="complaint-title-cell">
                        <strong className="complaint-title-link">
                          {item.title}
                        </strong>
                        <p className="complaint-desc-snippet">
                          {item.description}
                        </p>
                        <span className="complaint-date-sub">
                          📅 {formatDate(item.createdAt)} · {timeAgo(item.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="col-category">
                      <span className="category-pill">
                        <span className="cat-icon">
                          {categoryIcons[item.category] || "🔧"}
                        </span>
                        {item.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="col-location">
                      <span className="location-text">
                        📍 {item.location}
                      </span>
                    </td>

                    {/* Student Details (Requirement 2) */}
                    <td className="col-student">
                      <div className="student-profile-cell">
                        <div className="student-avatar-circle">
                          {studentName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="student-text">
                          <strong className="student-name">{studentName}</strong>
                          <span className="student-email" title={studentEmail}>
                            {studentEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="col-priority">
                      {getPriorityBadge(item.priority)}
                    </td>

                    {/* Status */}
                    <td className="col-status">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Quick Action */}
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="action-btn action-view"
                          onClick={() => onSelectComplaint(item)}
                          title="View complete complaint details"
                        >
                          👁️ View
                        </button>

                        {allowedTransitions.length > 0 && (
                          <button
                            type="button"
                            className="action-btn action-status"
                            onClick={(e) => openQuickUpdate(item, e)}
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
        /* ======================== CARDS VIEW ======================== */
        <div className="staff-cards-grid">
          {sortedComplaints.map((item) => {
            const studentName = item.submittedBy?.name || "Student";
            const studentEmail = item.submittedBy?.email || "N/A";
            const allowedTransitions = getAllowedStatusTransitions(item.status);

            return (
              <div
                key={item._id}
                className="staff-complaint-card"
                onClick={() => onSelectComplaint(item)}
              >
                {/* Card Top */}
                <div className="card-top-row">
                  <span className="category-pill">
                    <span className="cat-icon">
                      {categoryIcons[item.category] || "🔧"}
                    </span>
                    {item.category}
                  </span>
                  <div className="card-badges">
                    {getPriorityBadge(item.priority)}
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Card Content */}
                <div className="card-main-content">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-desc">{item.description}</p>
                </div>

                {/* Card Location & Date */}
                <div className="card-meta-details">
                  <span className="meta-loc">📍 {item.location}</span>
                  <span className="meta-time">
                    📅 {formatDate(item.createdAt)} ({timeAgo(item.createdAt)})
                  </span>
                </div>

                {/* Student Info Box */}
                <div className="card-student-box">
                  <div className="student-avatar-circle">
                    {studentName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="student-text">
                    <span className="student-label">Submitted by:</span>
                    <strong className="student-name">{studentName}</strong>
                    <span className="student-email">{studentEmail}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  className="card-actions-row"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="staff-btn staff-btn-secondary"
                    onClick={() => onSelectComplaint(item)}
                  >
                    👁️ View Details
                  </button>

                  {allowedTransitions.length > 0 && (
                    <button
                      type="button"
                      className="staff-btn staff-btn-primary"
                      onClick={(e) => openQuickUpdate(item, e)}
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

      {/* =========================================================
          QUICK STATUS UPDATE MODAL (Requirement 4)
          ========================================================= */}
      {updatingComplaint && (
        <div
          className="staff-modal-backdrop"
          onClick={() => setUpdatingComplaint(null)}
        >
          <div
            className="staff-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="modal-status-title"
          >
            <div className="modal-header">
              <div>
                <span className="modal-badge">⚡ Status Management</span>
                <h2 id="modal-status-title">Update Complaint Status</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setUpdatingComplaint(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-complaint-summary">
              <strong>{updatingComplaint.title}</strong>
              <div className="modal-complaint-meta">
                <span>📍 {updatingComplaint.location}</span>
                <span>
                  👤 Submitter: {updatingComplaint.submittedBy?.name || "Student"}
                </span>
                <span>
                  Current Status: <strong>{updatingComplaint.status}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleModalSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="target-status-select">
                  Select New Status <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  id="target-status-select"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  disabled={modalSaving}
                  required
                  className="modal-select"
                >
                  {getAllowedStatusTransitions(updatingComplaint.status).map(
                    (st) => (
                      <option key={st} value={st}>
                        {st === "Acknowledged" && "👁️ Acknowledged - Mark as received"}
                        {st === "In Progress" && "🔧 In Progress - Assigned & resolving"}
                        {st === "Resolved" && "✅ Resolved - Issue completed"}
                        {st === "Rejected" && "🚫 Rejected - Declined with note"}
                        {!["Acknowledged", "In Progress", "Resolved", "Rejected"].includes(st) && st}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="update-note-input">
                  Resolution Note / Comment (Optional)
                </label>
                <textarea
                  id="update-note-input"
                  className="modal-textarea"
                  rows={3}
                  maxLength={500}
                  placeholder="e.g., Assigned technician, replaced damaged fixture, resolved by campus team."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  disabled={modalSaving}
                />
                <span className="field-hint">
                  This note will be added to the complaint timeline and visible to the student.
                </span>
              </div>

              {modalError && (
                <div className="modal-error-box" role="alert">
                  ⚠️ {modalError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="staff-btn staff-btn-secondary"
                  onClick={() => setUpdatingComplaint(null)}
                  disabled={modalSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn staff-btn-primary"
                  disabled={modalSaving || !targetStatus}
                >
                  {modalSaving ? "Saving Update…" : "Confirm & Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { complaintService } from "../services/complaintService";

function Complaints({ complaints, onSelectComplaint, staffView = false }) {

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(complaints);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: complaints.length });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      complaintService.list({ search, status: statusFilter === "All" ? "" : statusFilter, page, limit: 10, sort: "priority" }, controller.signal)
        .then((data) => { setRows(data.complaints); setPagination(data.pagination); setError(""); })
        .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, search ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, statusFilter, page]);

  const sortedComplaints = rows;

  return (
    <div className="complaints-page">

      {/* Header */}
      <div className="page-header">

        <div>
          <h1>{staffView ? "Manage Complaints 🛠️" : "All Complaints 📋"}</h1>

          <p>
            {staffView ? "Review campus complaints and update their status." : "View and track all campus complaints."}
          </p>
        </div>

      </div>


      {/* Search */}
      <div className="complaints-toolbar">

        <input
          type="text"
          placeholder="Search complaints..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setLoading(true); }}
          className="search-box"
        />


        {/* Status Filters */}
        <div className="status-filters">

          <button
            className={
              statusFilter === "All"
                ? "active-filter"
                : ""
            }
            onClick={() => { setStatusFilter("All"); setPage(1); setLoading(true); }}
          >
            All
          </button>

          <button className={statusFilter === "Acknowledged" ? "active-filter" : ""} onClick={() => { setStatusFilter("Acknowledged"); setPage(1); setLoading(true); }}>Acknowledged</button>

          <button
            className={
              statusFilter === "Submitted"
                ? "active-filter"
                : ""
            }
            onClick={() => { setStatusFilter("Submitted"); setPage(1); setLoading(true); }}
          >
            Submitted
          </button>

          <button className={statusFilter === "Rejected" ? "active-filter" : ""} onClick={() => { setStatusFilter("Rejected"); setPage(1); setLoading(true); }}>Rejected</button>

          <button
            className={
              statusFilter === "In Progress"
                ? "active-filter"
                : ""
            }
            onClick={() => { setStatusFilter("In Progress"); setPage(1); setLoading(true); }}
          >
            In Progress
          </button>

          <button
            className={
              statusFilter === "Resolved"
                ? "active-filter"
                : ""
            }
            onClick={() => { setStatusFilter("Resolved"); setPage(1); setLoading(true); }}
          >
            Resolved
          </button>

        </div>

      </div>


      {/* Complaints */}
      <div className="complaints-list">

        {loading && <p role="status">Loading complaints…</p>}
        {error && <p role="alert" className="login-error">{error}</p>}

        {loading ? null : error ? null : sortedComplaints.length === 0 ? (

          <p className="no-results">
            No complaints found 🔍
          </p>

        ) : (

          sortedComplaints.map((complaint) => (

            <div
              className="complaint-card"
              key={complaint._id || complaint.id || complaint.title}
              onClick={() =>
                onSelectComplaint(complaint)
              }
            >

              <div className="complaint-icon">
                🔧
              </div>


              <div className="complaint-info">

                <h3>
                  {complaint.title}
                </h3>

                <p>
                  📍 {complaint.location}
                </p>

                <small>
                  Category:{" "}
                  {complaint.category || "Maintenance"}
                </small>

                <br />

                <small>
                  Priority: {complaint.priority}
                </small>

              </div>


              <div className="complaint-status">

                <span
                  className={
                    complaint.status === "Resolved"
                      ? "resolved-badge"
                      : ["Pending", "Submitted", "Acknowledged"].includes(complaint.status)
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

      {pagination.pages > 1 && <div className="pagination-controls">
        <button type="button" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }}>Previous</button>
        <span>Page {pagination.page} of {pagination.pages} · {pagination.total} complaints</span>
        <button type="button" disabled={page >= pagination.pages || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }}>Next</button>
      </div>}

    </div>
  );
}

export default Complaints;

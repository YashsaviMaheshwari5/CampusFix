import { useState } from "react";

function Complaints({ complaints, onSelectComplaint }) {

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  // Search complaints
  const searchResults = complaints.filter((complaint) =>
    complaint.title
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Filter by status
  const filteredComplaints = searchResults.filter(
    (complaint) => {

      if (statusFilter === "All") {
        return true;
      }

      return complaint.status === statusFilter;
    }
  );

  // Sort by priority
  const sortedComplaints = [...filteredComplaints].sort(
    (a, b) => {

      const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3
      };

      return (
        priorityOrder[a.priority] -
        priorityOrder[b.priority]
      );
    }
  );

  return (
    <div className="complaints-page">

      {/* Header */}
      <div className="page-header">

        <div>
          <h1>All Complaints 📋</h1>

          <p>
            View and track all campus complaints.
          </p>
        </div>

      </div>


      {/* Search */}
      <div className="complaints-toolbar">

        <input
          type="text"
          placeholder="Search complaints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            onClick={() => setStatusFilter("All")}
          >
            All
          </button>

          <button
            className={
              statusFilter === "Pending"
                ? "active-filter"
                : ""
            }
            onClick={() => setStatusFilter("Pending")}
          >
            Pending
          </button>

          <button
            className={
              statusFilter === "In Progress"
                ? "active-filter"
                : ""
            }
            onClick={() =>
              setStatusFilter("In Progress")
            }
          >
            In Progress
          </button>

          <button
            className={
              statusFilter === "Resolved"
                ? "active-filter"
                : ""
            }
            onClick={() =>
              setStatusFilter("Resolved")
            }
          >
            Resolved
          </button>

        </div>

      </div>


      {/* Complaints */}
      <div className="complaints-list">

        {sortedComplaints.length === 0 ? (

          <p className="no-results">
            No complaints found 🔍
          </p>

        ) : (

          sortedComplaints.map((complaint) => (

            <div
              className="complaint-card"
              key={complaint.title}
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
                      : complaint.status === "Pending"
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
  );
}

export default Complaints;
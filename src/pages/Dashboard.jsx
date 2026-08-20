import { useState } from "react";

function Dashboard({ complaints, onSelectComplaint }) {

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");


  // Search complaints
  const searchResults = complaints.filter((complaint) =>
    complaint.title
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  // Filter complaints
  const filteredComplaints = searchResults.filter((complaint) => {

    if (statusFilter === "All") {
      return true;
    }

    return complaint.status === statusFilter;
  });


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


  // Statistics
  const totalComplaints = complaints.length;

  const resolvedComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved"
  ).length;

  const progressComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "In Progress"
  ).length;

  const pendingComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Pending"
  ).length;


  return (
    <div className="dashboard">

      {/* ==================================
          HEADER
      ================================== */}

      <div className="dashboard-header">

        <div>

          <span className="dashboard-label">
            CAMPUSFIX DASHBOARD
          </span>

          <h1>
            Welcome back! 👋
          </h1>

          <p>
            Track campus issues and help make
            your campus better.
          </p>

        </div>


        <div className="profile">

          <div className="notification-bell">
            🔔
          </div>

          <div className="profile-avatar">
            YM
          </div>

          <div className="profile-info">

            <strong>
              Yashsavi M.
            </strong>

            <span>
              Student
            </span>

          </div>

        </div>

      </div>


      {/* ==================================
          STATISTICS
      ================================== */}

      <div className="stats">

        <div className="stat-card">

          <div className="stat-icon">
            📋
          </div>

          <div>

            <p>
              Total Complaints
            </p>

            <h2>
              {totalComplaints}
            </h2>

            <span>
              All submitted issues
            </span>

          </div>

        </div>


        <div className="stat-card resolved">

          <div className="stat-icon">
            ✅
          </div>

          <div>

            <p>
              Resolved
            </p>

            <h2>
              {resolvedComplaints}
            </h2>

            <span>
              Successfully completed
            </span>

          </div>

        </div>


        <div className="stat-card progress">

          <div className="stat-icon">
            🔧
          </div>

          <div>

            <p>
              In Progress
            </p>

            <h2>
              {progressComplaints}
            </h2>

            <span>
              Currently being handled
            </span>

          </div>

        </div>


        <div className="stat-card pending">

          <div className="stat-icon">
            ⏳
          </div>

          <div>

            <p>
              Pending
            </p>

            <h2>
              {pendingComplaints}
            </h2>

            <span>
              Waiting for action
            </span>

          </div>

        </div>

      </div>


      {/* ==================================
          RECENT COMPLAINTS
      ================================== */}

      <div className="recent-section">

        <div className="section-header">

          <div>

            <h2>
              Recent Complaints
            </h2>

            <p className="section-subtitle">
              Click a complaint to view its details.
            </p>

          </div>


          <input
            type="text"
            placeholder="🔍 Search complaints..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="search-box"
          />

        </div>


        {/* Filters */}

        <div className="status-filters">

          <button
            className={
              statusFilter === "All"
                ? "active-filter"
                : ""
            }
            onClick={() =>
              setStatusFilter("All")
            }
          >
            All
          </button>


          <button
            className={
              statusFilter === "Pending"
                ? "active-filter"
                : ""
            }
            onClick={() =>
              setStatusFilter("Pending")
            }
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


        {/* Complaint List */}

        <div className="complaints-list">

          {sortedComplaints.length === 0 ? (

            <div className="no-results">

              <div className="empty-icon">
                🔍
              </div>

              <h3>
                No complaints found
              </h3>

              <p>
                Try changing your search or filter.
              </p>

            </div>

          ) : (

            sortedComplaints.map((complaint) => (

              <div
                className="complaint-card"
                key={complaint.id || complaint.title}
                onClick={() =>
                  onSelectComplaint(complaint)
                }
              >

                <div className="complaint-icon">
                  {complaint.category === "Internet"
                    ? "📶"
                    : complaint.category === "Electricity"
                    ? "⚡"
                    : complaint.category === "Water"
                    ? "💧"
                    : "🔧"}
                </div>


                <div className="complaint-info">

                  <h3>
                    {complaint.title}
                  </h3>

                  <p>
                    📍 {complaint.location}
                  </p>

                  <div className="complaint-meta">

                    <span>
                      {complaint.category}
                    </span>

                    <span>
                      Priority: {complaint.priority}
                    </span>

                  </div>

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

    </div>
  );
}

export default Dashboard;
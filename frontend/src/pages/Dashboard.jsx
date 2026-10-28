import { useEffect, useState } from "react";
import { complaintService } from "../services/complaintService";

function Dashboard({ complaints, onSelectComplaint, user }) {

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
  }, []);

  // Logged-in user's name
  const userName = localStorage.getItem("userName") || "Student";


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
  const totalComplaints = serverStats?.total ?? complaints.length;

  const resolvedComplaints = serverStats?.resolved ?? complaints.filter(
    (complaint) =>
      complaint.status === "Resolved"
  ).length;

  const progressComplaints = serverStats?.inProgress ?? complaints.filter(
    (complaint) =>
      ["In Progress", "Acknowledged"].includes(complaint.status)
  ).length;

  const pendingComplaints = serverStats ? serverStats.submitted + serverStats.acknowledged : complaints.filter(
    (complaint) =>
      ["Submitted", "Pending"].includes(complaint.status)
  ).length;
  const rejectedComplaints = serverStats?.rejected ?? complaints.filter((complaint) => complaint.status === "Rejected").length;
  const initials = (user?.name || "Student").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();


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
            Welcome back, {userName}! 👋
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


          {/* Dynamic Avatar */}
          <div className="profile-avatar">
            YM
          </div>


          <div className="profile-info">

            {/* Dynamic User Name */}
            <strong>
              Yashsavi M.
            </strong>

            <span>
              {user?.role || "student"}
            </span>

          </div>

        </div>

      </div>


      {/* ==================================
          STATISTICS
      ================================== */}

      <div className="stats">

        {statsLoading && <p role="status">Loading dashboard statistics…</p>}
        {statsError && <p role="alert">{statsError}</p>}

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
              Awaiting review
            </p>

            <h2>
              {pendingComplaints}
            </h2>

            <span>
              Waiting for action
            </span>

          </div>

        </div>

        <div className="stat-card pending">
          <div className="stat-icon">🚫</div>
          <div><p>Rejected</p><h2>{rejectedComplaints}</h2><span>Reviewed and declined</span></div>
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
              statusFilter === "Submitted"
                ? "active-filter"
                : ""
            }
            onClick={() =>
              setStatusFilter("Submitted")
            }
          >
            Submitted
          </button>

          <button className={statusFilter === "Acknowledged" ? "active-filter" : ""} onClick={() => setStatusFilter("Acknowledged")}>Acknowledged</button>


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

          <button className={statusFilter === "Rejected" ? "active-filter" : ""} onClick={() => setStatusFilter("Rejected")}>Rejected</button>


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
                key={complaint._id || complaint.id || complaint.title}
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

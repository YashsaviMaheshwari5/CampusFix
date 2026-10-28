import { useEffect, useState } from "react";
import { API_BASE_URL } from "../services/api";
import { complaintService } from "../services/complaintService";
import StatusUpdatePanel from "../components/StatusUpdatePanel.jsx";
import { canManageComplaints } from "../utils/complaintStatus.js";

function ComplaintDetails({ complaint, user, onUpdated, onBack }) {
  const [loadedComplaint, setLoadedComplaint] = useState(null);
  const [loading, setLoading] = useState(Boolean(complaint?._id));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!complaint?._id) return undefined;
    const controller = new AbortController();
    complaintService.get(complaint._id, controller.signal)
      .then(({ complaint: result }) => { setLoadedComplaint(result); setError(""); })
      .catch((loadError) => { if (loadError.name !== "AbortError") setError(loadError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [complaint?._id, attempt]);

  const details = loadedComplaint || complaint;
  const updateComplaint = (updatedComplaint) => {
    setLoadedComplaint(updatedComplaint);
    onUpdated?.(updatedComplaint);
  };
  if (loading) return <div className="details-page"><p role="status">Loading complaint details…</p></div>;
  if (error) return <div className="details-page"><p role="alert" className="login-error">{error}</p><button className="submit-btn" onClick={() => { setError(""); setLoading(true); setAttempt((value) => value + 1); }}>Try again</button><button className="back-btn" onClick={onBack}>← Back to Complaints</button></div>;

  // Safety check
  if (!details) {
    return (
      <div className="details-page">
        <h2>Complaint not found.</h2>

        <button
          className="submit-btn"
          onClick={onBack}
        >
          ← Back
        </button>
      </div>
    );
  }


  const timeline = (details.statusHistory || []).map((event) => ({
    title: event.status,
    description: event.note || `Complaint status changed to ${event.status}.`,
    completed: true,
    date: event.changedAt ? new Date(event.changedAt).toLocaleString() : "",
  }));
  if (!timeline.length) timeline.push({ title: details.status, description: "Current complaint status.", completed: true, date: "" });


  return (
    <div className="details-page">

      {/* ==================================
          BACK BUTTON
      ================================== */}

      <button
        className="back-btn"
        onClick={onBack}
      >
        ← Back to Complaints
      </button>


      {/* ==================================
          HEADER
      ================================== */}

      <div className="details-header">

        <div>

          <span className="dashboard-label">
            COMPLAINT DETAILS
          </span>

          <h1>
            {details.title}
          </h1>

          <p>
            📍 {details.location}
          </p>

        </div>


        {/* Status */}

        <span
          className={
            details.status === "Resolved"
              ? "resolved-badge"
              : ["Pending", "Submitted", "Acknowledged"].includes(details.status)
              ? "pending-badge"
              : "progress-badge"
          }
        >
          {details.status}
        </span>

      </div>


      {/* ==================================
          DETAILS GRID
      ================================== */}

      <div className="details-grid">

        {/* Main Information */}

        <div className="details-main">

          {/* Description */}

          <div className="details-card">

            <h2>
              Description
            </h2>

            <p className="description-text">
              {details.description}
            </p>

          </div>

          {canManageComplaints(user?.role) && <StatusUpdatePanel key={`${details._id}:${details.status}`} role={user.role} complaint={details} onUpdated={updateComplaint} />}

          {details.attachments?.length > 0 && <div className="details-card">
            <h2>Attachments</h2>
            {details.attachments.map((file) => <p key={file.filename}><a href={`${API_BASE_URL}/complaints/${details._id}/attachments/${encodeURIComponent(file.filename)}`} target="_blank" rel="noreferrer">{file.originalName || "Open attachment"}</a></p>)}
          </div>}


          {/* Timeline */}

          <div className="details-card">

            <h2>
              Complaint Timeline
            </h2>

            <div className="timeline">

              {timeline.map((item, index) => (

                <div
                  className="timeline-item"
                  key={index}
                >

                  <div
                    className={
                      item.completed
                        ? "timeline-dot completed"
                        : "timeline-dot"
                    }
                  >
                    {item.completed ? "✓" : ""}
                  </div>


                  <div className="timeline-content">

                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {item.description}
                    </p>
                    {item.date && <small>{item.date}</small>}

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>


        {/* Side Information */}

        <div className="details-side">

          <div className="details-card">

            <h2>
              Complaint Information
            </h2>


            <div className="detail-row">

              <span>
                Category
              </span>

              <strong>
                {details.category || "Maintenance"}
              </strong>

            </div>


            <div className="detail-row">

              <span>
                Priority
              </span>

              <strong>
                {details.priority}
              </strong>

            </div>


            <div className="detail-row">

              <span>
                Status
              </span>

              <strong>
                {details.status}
              </strong>

            </div>


            <div className="detail-row">

              <span>
                Location
              </span>

              <strong>
                {details.location}
              </strong>

            </div>

          </div>


          {/* Help card */}

          <div className="details-help">

            <div className="info-icon">
              💡
            </div>

            <h3>
              Need more help?
            </h3>

            <p>
              If the issue has not been resolved,
              please contact the campus administration.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ComplaintDetails;

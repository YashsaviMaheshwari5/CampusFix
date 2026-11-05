import { useState } from "react";
import { API_BASE_URL } from "../services/api.js";
import { getAllowedStatusTransitions } from "../utils/complaintStatus.js";

export default function StaffComplaintDetails({
  complaint,
  onBack,
  onUpdateStatus,
}) {
  const allowed = getAllowedStatusTransitions(complaint.status);
  const [nextStatus, setNextStatus] = useState(allowed[0] || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdate = async (e) => {
    if (
  (nextStatus === "Rejected" || nextStatus === "Resolved") &&
  !note.trim()
) {
  setError(
    nextStatus === "Rejected"
      ? "Please provide a reason for rejection."
      : "Please provide a resolution note."
  );
  return;
}
    e.preventDefault();
    if (!nextStatus || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await onUpdateStatus(complaint._id, nextStatus, note.trim());
      setSuccess(`✓ Status successfully changed to ${nextStatus}.`);
      setNote("");
    } catch (err) {
      setError(err.message || "Failed to update complaint status.");
    } finally {
      setSaving(false);
    }
  };

  const studentName = complaint.submittedBy?.name || "Student";
  const studentEmail = complaint.submittedBy?.email || "N/A";

  const timeline = (complaint.statusHistory || []).map((ev) => ({
    title: ev.status,
    description: ev.note || `Status transitioned to ${ev.status}`,
    date: ev.changedAt ? new Date(ev.changedAt).toLocaleString() : "",
    changedBy: ev.changedBy?.name || "Staff",
  }));

  if (!timeline.length) {
    timeline.push({
      title: complaint.status,
      description: "Initial complaint state recorded.",
      date: complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "",
      changedBy: "System",
    });
  }

  return (
    <div className="details-view-container">
 <button
  type="button"
  onClick={onBack}
  aria-label="Close complaint details"
  style={{
    position: "absolute",
    top: "18px",
    right: "20px",
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: "22px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  }}
>
  ×
</button>
      <div
  className="details-view-container"
  style={{ position: "relative" }}
>
        <div>
          <span className="details-tag">COMPLAINT INSPECTION</span>
          <h1>{complaint.title}</h1>
          <p className="details-location">📍 {complaint.location}</p>
        </div>

        <div className="details-header-badges">
          <span className="priority-pill p-high">Priority: {complaint.priority}</span>
          <span className="status-badge b-resolved">Status: {complaint.status}</span>
        </div>
      </div>

      <div className="details-content-grid">
        {/* Main Column */}
        <div className="details-main-col">
          {/* Issue Description */}
          <div className="content-card">
            <h2>Detailed Description</h2>
            <p className="full-description-text">{complaint.description}</p>
          </div>

{/* Status Update Panel for Staff */}
<div className="content-card update-action-card">
  <h2>Manage Complaint</h2>

  <p className="panel-sub">
    Current Status: <strong>{complaint.status}</strong>
  </p>

  {allowed.length === 0 ? (
    <p className="terminal-note">
      This complaint is already in its final status ({complaint.status}).
    </p>
  ) : (
    <form onSubmit={handleUpdate} className="inline-update-form">
      <div className="form-field">
        <label htmlFor="details-next-status">Choose Action</label>

        <select
          id="details-next-status"
          value={nextStatus}
          onChange={(e) => {
            setNextStatus(e.target.value);
            setError("");
          }}
          disabled={saving}
          required
        >
          {allowed.map((st) => (
            <option key={st} value={st}>
              {st === "Acknowledged" ? "Accept Complaint" :
               st === "In Progress" ? "Start Working" :
               st === "Resolved" ? "Resolve Complaint" :
               st === "Rejected" ? "Reject Complaint" : st}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="details-update-note">
          {nextStatus === "Rejected"
            ? "Reason for Rejection *"
            : nextStatus === "Resolved"
            ? "Resolution Note *"
            : "Additional Remarks (Optional)"}
        </label>

        <textarea
          id="details-update-note"
          rows={4}
          maxLength={500}
          placeholder={
            nextStatus === "Rejected"
              ? "Explain why this complaint is being rejected..."
              : nextStatus === "Resolved"
              ? "Describe how the complaint was resolved..."
              : "Add remarks about the complaint..."
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={saving}
          required={nextStatus === "Rejected" || nextStatus === "Resolved"}
        />
      </div>

      {error && <div className="modal-error-alert">{error}</div>}
      {success && <div className="modal-success-alert">{success}</div>}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={saving || !nextStatus}
      >
        {saving
          ? "Updating..."
          : nextStatus === "Acknowledged"
          ? "Accept Complaint"
          : nextStatus === "In Progress"
          ? "Start Working"
          : nextStatus === "Resolved"
          ? "Resolve Complaint"
          : nextStatus === "Rejected"
          ? "Reject Complaint"
          : "Update Status"}
      </button>
    </form>
  )}
</div>

          {/* Attachments */}
          {complaint.attachments?.length > 0 && (
            <div className="content-card">
              <h2>Student Uploaded Attachments</h2>
              <div className="attachments-list">
                {complaint.attachments.map((file) => (
                  <div key={file.filename} className="attachment-item">
                    <span>📎 {file.originalName || "Attachment"}</span>
                    <a
                      href={`${API_BASE_URL}/complaints/${complaint._id}/attachments/${encodeURIComponent(file.filename)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download"
                    >
                      View / Download ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="content-card">
            <h2>Complaint Status History Timeline</h2>
            <div className="timeline-trail">
              {timeline.map((ev, i) => (
                <div key={i} className="timeline-node">
                  <div className="timeline-dot-circle">✓</div>
                  <div className="timeline-details">
                    <h3>{ev.title}</h3>
                    <p>{ev.description}</p>
                    <span className="timeline-timestamp">
                      {ev.date} {ev.changedBy && `· by ${ev.changedBy}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="details-side-col">
          {/* Submitter Box */}
          <div className="content-card student-profile-box">
            <h2>Student Details</h2>
            <div className="student-profile-large">
              <div className="student-initials-bubble big">
                {studentName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <strong>{studentName}</strong>
                <span>{studentEmail}</span>
              </div>
            </div>
            <div className="side-metric-row">
              <span>Submitted On:</span>
              <strong>
                {complaint.createdAt
                  ? new Date(complaint.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "N/A"}
              </strong>
            </div>
          </div>

          {/* Meta Info */}
          <div className="content-card">
            <h2>Complaint Information</h2>
            <div className="side-metric-row">
              <span>Category:</span>
              <strong>{complaint.category || "Maintenance"}</strong>
            </div>
            <div className="side-metric-row">
              <span>Priority:</span>
              <strong>{complaint.priority}</strong>
            </div>
            <div className="side-metric-row">
              <span>Current Status:</span>
              <strong>{complaint.status}</strong>
            </div>
            <div className="side-metric-row">
              <span>Location:</span>
              <strong>{complaint.location}</strong>
            </div>
          </div>

          <div className="content-card student-portal-reference">
            <h3>🔄 Real-Time Database Sync</h3>
            <p>
              Any changes made here directly synchronize with MongoDB and update the student&apos;s view in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


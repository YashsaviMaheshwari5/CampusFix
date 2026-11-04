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
      <button type="button" className="btn-back" onClick={onBack}>
        ← Back to Complaints Dashboard
      </button>

      <div className="details-header-card">
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
            <h2>⚡ Update Status & Add Resolution Note</h2>
            <p className="panel-sub">
              Current Status: <strong>{complaint.status}</strong>
            </p>

            {allowed.length === 0 ? (
              <p className="terminal-note">
                This complaint is in a final state ({complaint.status}) and cannot be transitioned further.
              </p>
            ) : (
              <form onSubmit={handleUpdate} className="inline-update-form">
                <div className="form-field">
                  <label htmlFor="details-next-status">New Status</label>
                  <select
                    id="details-next-status"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    disabled={saving}
                    required
                  >
                    {allowed.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="details-update-note">Audit Note / Resolution Remarks (Optional)</label>
                  <textarea
                    id="details-update-note"
                    rows={3}
                    maxLength={500}
                    placeholder="Enter notes about work done, technicians dispatched, or reasons for status change..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={saving}
                  />
                </div>

                {error && <div className="modal-error-alert">⚠️ {error}</div>}
                {success && <div className="modal-success-alert">{success}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !nextStatus}
                >
                  {saving ? "Updating in MongoDB…" : "Save Status & Notify Student"}
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


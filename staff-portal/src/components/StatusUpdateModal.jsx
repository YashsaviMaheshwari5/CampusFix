import { useState } from "react";
import { getAllowedStatusTransitions } from "../utils/complaintStatus.js";

export default function StatusUpdateModal({
  complaint,
  onClose,
  onUpdateStatus,
}) {
  const allowed = getAllowedStatusTransitions(complaint.status);
  const [targetStatus, setTargetStatus] = useState(allowed[0] || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetStatus || saving) return;

    setSaving(true);
    setError("");

    try {
      await onUpdateStatus(complaint._id, targetStatus, note.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Could not update complaint status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <div>
            <span className="modal-tag">⚡ STATUS MANAGEMENT</span>
            <h2>Update Complaint Status</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-target-box">
          <strong className="modal-issue-title">{complaint.title}</strong>
          <div className="modal-issue-meta">
            <span>📍 {complaint.location}</span>
            <span>👤 Student: {complaint.submittedBy?.name || "Student"}</span>
            <span>Current Status: <strong>{complaint.status}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="form-field">
            <label htmlFor="new-status-select">Select New Status</label>
            <select
              id="new-status-select"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              disabled={saving}
              required
            >
              {allowed.map((st) => (
                <option key={st} value={st}>
                  {st === "Acknowledged" && "👁️ Acknowledged — Reviewed by staff"}
                  {st === "In Progress" && "🔧 In Progress — Assigned & resolving"}
                  {st === "Resolved" && "✅ Resolved — Issue completely fixed"}
                  {st === "Rejected" && "🚫 Rejected — Closed / Invalid"}
                  {!["Acknowledged", "In Progress", "Resolved", "Rejected"].includes(st) && st}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="modal-note-area">Resolution Note / Remarks (Optional)</label>
            <textarea
              id="modal-note-area"
              rows={3}
              maxLength={500}
              placeholder="e.g., Electrician dispatched to site, replacement part installed."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saving}
            />
            <small className="help-text">
              This comment will be appended to the complaint timeline in MongoDB and will be visible on the student portal.
            </small>
          </div>

          {error && <div className="modal-error-alert">⚠️ {error}</div>}

          <div className="modal-footer-btns">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !targetStatus}
            >
              {saving ? "Saving to MongoDB…" : "Confirm & Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

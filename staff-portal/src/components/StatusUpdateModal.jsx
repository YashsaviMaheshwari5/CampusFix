
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

  const requiresNote =
    targetStatus === "Rejected" || targetStatus === "Resolved";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!targetStatus || saving) return;

    if (requiresNote && !note.trim()) {
      setError(
        targetStatus === "Rejected"
          ? "Please provide a reason for rejecting this complaint."
          : "Please provide a resolution note before closing this complaint."
      );
      return;
    }

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
            <span className="modal-tag">STATUS MANAGEMENT</span>
            <h2>Update Complaint Status</h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <div className="modal-target-box">
          <strong className="modal-issue-title">
            {complaint.title}
          </strong>

          <div className="modal-issue-meta">
            <span>📍 {complaint.location}</span>
            <span>
              👤 Student: {complaint.submittedBy?.name || "Student"}
            </span>
            <span>
              Current Status: <strong>{complaint.status}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="form-field">
            <label htmlFor="new-status-select">
              Select New Status
            </label>

            <select
              id="new-status-select"
              value={targetStatus}
              onChange={(e) => {
                setTargetStatus(e.target.value);
                setError("");
              }}
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
            <label htmlFor="modal-note-area">
              {targetStatus === "Rejected"
                ? "Reason for Rejection *"
                : targetStatus === "Resolved"
                  ? "Resolution Note *"
                  : "Remarks (Optional)"}
            </label>

            <textarea
              id="modal-note-area"
              rows={4}
              maxLength={500}
              placeholder={
                targetStatus === "Rejected"
                  ? "Explain why this complaint is being rejected..."
                  : targetStatus === "Resolved"
                    ? "Describe how this issue was resolved..."
                    : "Add an update for the student..."
              }
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError("");
              }}
              disabled={saving}
              required={requiresNote}
            />

            <small className="help-text">
              {requiresNote
                ? "This information is required before updating the status."
                : "You can optionally add remarks for the student."}
            </small>
          </div>

          {error && (
            <div className="modal-error-alert">
              ⚠️ {error}
            </div>
          )}

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
              {saving ? "Saving..." : "Confirm & Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

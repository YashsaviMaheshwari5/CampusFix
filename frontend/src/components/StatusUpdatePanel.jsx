import { useState } from 'react';
import { updateStatusAndRefresh } from '../services/complaintService.js';
import { canManageComplaints, getAllowedStatusTransitions } from '../utils/complaintStatus.js';

function statusErrorMessage(error) {
  if (error.status === 401) return 'Your session has expired. Sign in again to update this complaint.';
  if (error.status === 403) return 'Your account is not authorized to update complaint statuses.';
  if (error.status === 400) return error.message || 'The selected status is not valid for this complaint.';
  if (error.code === 'NETWORK_ERROR') return error.message;
  return error.message || 'The complaint status could not be updated.';
}

export default function StatusUpdatePanel({ role, complaint, onUpdated }) {
  const allowedStatuses = getAllowedStatusTransitions(complaint.status);
  const [nextStatus, setNextStatus] = useState(allowedStatuses[0] || '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!canManageComplaints(role)) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || !nextStatus || !allowedStatuses.includes(nextStatus)) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await updateStatusAndRefresh(complaint._id, { status: nextStatus, note: note.trim() });
      onUpdated(result.complaint);
      if (result.refreshed) {
        setSuccess('Complaint status and history updated. The submitter will see a notification if notifications are enabled.');
      } else {
        setError(`Status was saved, but refreshed complaint details could not be loaded. ${statusErrorMessage(result.refreshError)}`);
      }
      setNote('');
    } catch (updateError) {
      setError(statusErrorMessage(updateError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="details-card status-update-card" aria-labelledby="status-update-heading">
      <h2 id="status-update-heading">Update complaint status</h2>
      <p>Current status: <strong>{complaint.status}</strong></p>
      {allowedStatuses.length === 0 ? (
        <p>This complaint is in a final status and has no further transitions.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="complaint-next-status">New status</label>
            <select id="complaint-next-status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} disabled={saving} required>
              {allowedStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="complaint-status-note">Update note (optional)</label>
            <textarea id="complaint-status-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} disabled={saving} />
          </div>
          {error && <p role="alert" className="login-error">{error}</p>}
          {success && <p role="status" className="success-message">{success}</p>}
          <button className="submit-btn" type="submit" disabled={saving || !nextStatus}>
            {saving ? 'Updating status…' : 'Update Status'}
          </button>
        </form>
      )}
      {!error && !success && saving && <p role="status">Saving status and refreshing complaint history…</p>}
    </section>
  );
}

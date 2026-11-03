import { canManageComplaints } from "../utils/complaintStatus.js";

/**
 * StaffGuard: Ensures that ONLY authenticated staff and administrators can access
 * components or pages inside the staff folder.
 * If a student or guest attempts to enter, access is blocked immediately.
 */
export default function StaffGuard({ user, children, onFallback }) {
  const isAuthorizedStaff = canManageComplaints(user?.role);

  if (!isAuthorizedStaff) {
    return (
      <div className="staff-access-denied-container">
        <div className="staff-access-denied-card">
          <div className="access-denied-icon">🔒</div>
          <h2>Restricted Staff Area</h2>
          <p className="access-denied-subtitle">
            This module is reserved exclusively for university staff members and administrators.
          </p>

          <div className="access-denied-badge-row">
            <span>Your current role:</span>
            <strong className="denied-role-pill">
              {user?.role ? user.role.toUpperCase() : "UNAUTHENTICATED"}
            </strong>
          </div>

          <p className="access-denied-hint">
            You do not have permission to view or manage university complaint operations from this area.
          </p>

          {onFallback && (
            <button
              type="button"
              className="staff-btn staff-btn-primary"
              onClick={onFallback}
              style={{ marginTop: "16px" }}
            >
              ← Return to Student Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
}


export const complaintStatuses = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected'];

const statusTransitions = {
  Submitted: ['Acknowledged', 'Rejected'],
  Acknowledged: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: [],
  Rejected: [],
};

export function canManageComplaints(role) {
  return role === 'staff' || role === 'admin';
}

export function getAllowedStatusTransitions(status) {
  return statusTransitions[status] || [];
}

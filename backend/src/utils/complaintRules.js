export const complaintStatuses = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected'];

const statusTransitions = {
  Submitted: ['Acknowledged', 'Rejected'],
  Acknowledged: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: [],
  Rejected: [],
};

export function isComplaintStatus(value) { return complaintStatuses.includes(value); }
export function canTransitionComplaintStatus(from, to) { return from === to || Boolean(statusTransitions[from]?.includes(to)); }
export function canViewComplaint(role, userId, ownerId) { return role !== 'student' || String(userId) === String(ownerId); }
export function canEditComplaint(role, userId, ownerId, status) { return ['staff', 'admin'].includes(role) || (String(userId) === String(ownerId) && ['Submitted', 'Acknowledged'].includes(status)); }
export function canDeleteComplaint(role, userId, ownerId, status) { return role === 'admin' || (String(userId) === String(ownerId) && ['Submitted', 'Acknowledged'].includes(status)); }

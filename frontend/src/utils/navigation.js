import { canManageComplaints } from './complaintStatus.js';

const baseMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'complaints', label: 'Complaints', icon: '📋' },
  { id: 'report', label: 'Report Issue', icon: '📝' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'knowledge', label: 'Knowledge Base', icon: '📚' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
];

export function getSidebarMenuItems(role) {
  return canManageComplaints(role)
    ? [...baseMenuItems, { id: 'staff-complaints', label: 'Manage Complaints', icon: '🛠️' }]
    : baseMenuItems;
}

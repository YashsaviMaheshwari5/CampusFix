import { apiRequest } from './api.js';

export const complaintService = {
  // Fetch complaints from MongoDB
  list: (params = {}, signal) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    );
    return apiRequest(`/staff/complaints${query.size ? `?${query}` : ''}`, { signal })
      .catch(() => apiRequest(`/complaints${query.size ? `?${query}` : ''}`, { signal }));
  },

  // Fetch full details of one complaint
  get: (id, signal) => apiRequest(`/complaints/${id}`, { signal }),

  // Update status by staff
  updateStatus: (id, changes) =>
    apiRequest(`/staff/complaints/${id}/status`, {
      method: 'PATCH',
      body: changes,
    }),

  // Fetch dashboard statistics
  stats: (signal) =>
    apiRequest('/staff/stats', { signal }).catch(() =>
      apiRequest('/dashboard/stats', { signal })
    ),
};

export async function updateStatusAndRefresh(id, changes) {
  const { complaint: savedComplaint } = await complaintService.updateStatus(id, changes);
  try {
    const { complaint } = await complaintService.get(id);
    return { complaint, refreshed: true, refreshError: null };
  } catch (refreshError) {
    return { complaint: savedComplaint, refreshed: false, refreshError };
  }
}

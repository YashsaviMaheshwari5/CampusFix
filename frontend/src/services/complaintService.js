import { apiRequest } from './api.js';
export const complaintService = {
  list: (params = {}, signal) => { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)); return apiRequest(`/complaints${query.size ? `?${query}` : ''}`, { signal }); },
  get: (id, signal) => apiRequest(`/complaints/${id}`, { signal }),
  create: (formData) => apiRequest('/complaints', { method: 'POST', body: formData }),
  update: (id, changes) => apiRequest(`/complaints/${id}`, { method: 'PATCH', body: changes }),
  updateStatus: (id, changes) => apiRequest(`/staff/complaints/${id}/status`, { method: 'PATCH', body: changes }),
  remove: (id) => apiRequest(`/complaints/${id}`, { method: 'DELETE' }),
  stats: (signal) => apiRequest('/dashboard/stats', { signal }),
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

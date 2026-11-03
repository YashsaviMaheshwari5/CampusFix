import { apiRequest } from "../services/api.js";

/**
 * Dedicated staff operations API service.
 * All endpoints interact with protected staff-only routes.
 */
export const staffService = {
  // Fetch all campus complaints for staff management
  listComplaints: (params = {}, signal) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    );
    return apiRequest(`/staff/complaints${query.size ? `?${query}` : ""}`, { signal })
      .catch(() => {
        // Fallback to standard complaints endpoint if needed
        return apiRequest(`/complaints${query.size ? `?${query}` : ""}`, { signal });
      });
  },

  // Fetch complete complaint details
  getComplaint: (id, signal) => apiRequest(`/complaints/${id}`, { signal }),

  // Fetch staff statistics overview
  getStats: (signal) => {
    return apiRequest("/staff/stats", { signal }).catch(() => {
      // Fallback to general dashboard stats if needed
      return apiRequest("/dashboard/stats", { signal });
    });
  },

  // Update complaint status with audit note
  updateStatus: (id, changes) => {
    return apiRequest(`/staff/complaints/${id}/status`, {
      method: "PATCH",
      body: changes,
    });
  },
};


export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; }
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body instanceof FormData ? {} : body ? { 'Content-Type': 'application/json' } : {},
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Could not reach CampusFix. Check that the API server is running.', 0, 'NETWORK_ERROR');
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new ApiError(payload.error?.message || `Request failed (${response.status}).`, response.status, payload.error?.code);
  return payload.data;
}

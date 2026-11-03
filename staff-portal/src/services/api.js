export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `Request failed with status ${response.status}`;
      const code = payload?.error?.code || 'UNKNOWN_ERROR';
      throw new ApiError(message, response.status, code, payload?.error?.details);
    }

    return payload?.data !== undefined ? payload.data : payload;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Cannot reach CampusFix server. Ensure backend is running.', 0, 'NETWORK_ERROR');
  }
}


import { apiRequest } from './api.js';
export const authService = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (details) => apiRequest('/auth/register', { method: 'POST', body: details }),
  me: (signal) => apiRequest('/auth/me', { signal }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

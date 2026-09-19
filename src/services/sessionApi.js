import { ApiClientError, apiRequest } from './apiClient.js';

export async function restoreCookieSession({ signal, request = apiRequest } = {}) {
  try {
    return await request('/auth/me', { signal });
  } catch (error) {
    // No session cookie is the normal anonymous state, not an application error.
    if (error instanceof ApiClientError && error.status === 401) return null;
    throw error;
  }
}

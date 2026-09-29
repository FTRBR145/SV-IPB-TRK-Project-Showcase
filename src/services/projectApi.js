import { apiRequest, ApiClientError } from './apiClient.js';

// Existing screens filter and count the complete catalogue locally. Traverse
// every API page before publishing that catalogue to avoid partial statistics.
export async function loadProjectCatalog({ signal, scope = 'public' } = {}) {
  const projects = new Map();
  let page = 1;
  let totalPages;
  do {
    const { data, meta } = await apiRequest(`/projects?page=${page}&limit=100&scope=${scope}`, { signal, includeMeta: true });
    if (!Array.isArray(data) || !Number.isSafeInteger(meta?.totalPages) || meta.totalPages < 1 || meta.page !== page) {
      throw new ApiClientError('Respons daftar projek tidak valid.', { code: 'INVALID_PAGINATION' });
    }
    for (const project of data) projects.set(project.id, project);
    totalPages = meta.totalPages;
    page++;
  } while (page <= totalPages);
  return [...projects.values()];
}

export function getProjectById(id, { signal } = {}) {
  return apiRequest(`/projects/${encodeURIComponent(id)}`, { signal });
}

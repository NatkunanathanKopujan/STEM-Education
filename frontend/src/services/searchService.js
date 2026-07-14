import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const searchService = {
  search: async (params) => unwrap(await apiClient.get('/search', { params })),
  suggestions: async (params) => unwrap(await apiClient.get('/search/suggestions', { params })),
  history: async () => unwrap(await apiClient.get('/search/history')),
  clearHistory: async () => unwrap(await apiClient.delete('/search/history')),
  save: async (payload) => unwrap(await apiClient.post('/search/save', payload)),
  saved: async () => unwrap(await apiClient.get('/search/saved')),
  updateSaved: async (id, payload) => unwrap(await apiClient.put(`/search/saved/${id}`, payload)),
  deleteSaved: async (id) => unwrap(await apiClient.delete(`/search/saved/${id}`)),
  analytics: async () => unwrap(await apiClient.get('/search/analytics')),
};

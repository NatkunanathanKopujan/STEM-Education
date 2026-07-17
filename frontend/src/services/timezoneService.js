import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

function compactValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const timezoneService = {
  list: async (params) => unwrap(await apiClient.get('/timezones', { params: compactValues(params) })),
  get: async (id) => unwrap(await apiClient.get(`/timezones/${id}`)),
  create: async (payload) => unwrap(await apiClient.post('/timezones', payload)),
  update: async (id, payload) => unwrap(await apiClient.put(`/timezones/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/timezones/${id}`)),
};

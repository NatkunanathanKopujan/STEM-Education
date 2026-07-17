import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

function compactValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const academicYearService = {
  list: async (params) => unwrap(await apiClient.get('/academic-years', { params: compactValues(params) })),
  get: async (id) => unwrap(await apiClient.get(`/academic-years/${id}`)),
  create: async (payload) => unwrap(await apiClient.post('/academic-years', payload)),
  update: async (id, payload) => unwrap(await apiClient.put(`/academic-years/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/academic-years/${id}`)),
};

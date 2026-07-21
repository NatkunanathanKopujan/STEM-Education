import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const departmentService = {
  list: async (params) => unwrap(await apiClient.get('/departments', { params })),
  get: async (id) => unwrap(await apiClient.get(`/departments/${id}`)),
  create: async (payload) => unwrap(await apiClient.post('/departments', payload)),
  update: async (id, payload) => unwrap(await apiClient.put(`/departments/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/departments/${id}`)),
};

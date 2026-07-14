import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const superAdminService = {
  getDashboard: async () => {
    const response = await apiClient.get('/super-admin');
    return unwrap(response);
  },
  getAdmins: async (params) => {
    const response = await apiClient.get('/super-admin', { params });
    return unwrap(response);
  },
  createAdmin: async (payload) => {
    const response = await apiClient.post('/super-admin', payload);
    return unwrap(response);
  },
  updateAdmin: async (id, payload) => {
    const response = await apiClient.put(`/super-admin/${id}`, payload);
    return unwrap(response);
  },
  deleteAdmin: async (id) => {
    const response = await apiClient.delete(`/super-admin/${id}`);
    return unwrap(response);
  },
  getAiProviders: async () => unwrap(await apiClient.get('/ai/providers')),
  getAiLogs: async (params) => unwrap(await apiClient.get('/ai/logs', { params })),
  getAiCosts: async () => unwrap(await apiClient.get('/ai/costs')),
};

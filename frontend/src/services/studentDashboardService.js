import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const studentDashboardService = {
  getDashboard: async () => unwrap(await apiClient.get('/student')),
  getMaterials: async (params) => unwrap(await apiClient.get('/materials', { params })),
  getQuizResults: async (params) => unwrap(await apiClient.get('/results', { params })),
};

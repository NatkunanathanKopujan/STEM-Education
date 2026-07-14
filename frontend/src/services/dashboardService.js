import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const dashboardService = {
  summary: async () => unwrap(await apiClient.get('/dashboard/summary')),
  users: async () => unwrap(await apiClient.get('/dashboard/users')),
  curriculums: async () => unwrap(await apiClient.get('/dashboard/curriculums')),
};

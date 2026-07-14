import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const adminDashboardService = {
  getDashboard: async () => unwrap(await apiClient.get('/admin')),
  getTeachers: async (params) => unwrap(await apiClient.get('/teacher', { params })),
  getStudents: async (params) => unwrap(await apiClient.get('/student', { params })),
  getCurriculums: async (params) => unwrap(await apiClient.get('/curriculum', { params })),
};

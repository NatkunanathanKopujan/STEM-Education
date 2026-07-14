import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const reportsService = {
  getDashboard: async (params) => unwrap(await apiClient.get('/reports/dashboard', { params })),
  getStudents: async (params) => unwrap(await apiClient.get('/reports/students', { params })),
  getTeachers: async (params) => unwrap(await apiClient.get('/reports/teachers', { params })),
  getQuizzes: async (params) => unwrap(await apiClient.get('/reports/quizzes', { params })),
  getMaterials: async (params) => unwrap(await apiClient.get('/reports/materials', { params })),
  getAi: async (params) => unwrap(await apiClient.get('/reports/ai', { params })),
  exportReport: async (format, payload) =>
    unwrap(await apiClient.post(`/reports/export/${format}`, { ...payload, format })),
};

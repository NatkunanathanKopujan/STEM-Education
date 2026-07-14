import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const teacherDashboardService = {
  getDashboard: async () => unwrap(await apiClient.get('/teacher')),
  getStudents: async (params) => unwrap(await apiClient.get('/student', { params })),
  getMaterials: async (params) => unwrap(await apiClient.get('/materials', { params })),
  getQuizAnalytics: async (params) => unwrap(await apiClient.get('/quiz', { params })),
  getAnalyticsDashboard: async () => unwrap(await apiClient.get('/teacher/analytics/dashboard')),
  getStudentAnalytics: async (studentId) =>
    unwrap(await apiClient.get(`/teacher/analytics/student/${studentId}`)),
  getTopicAnalytics: async () => unwrap(await apiClient.get('/teacher/analytics/topics')),
  getQuestionExposure: async () => unwrap(await apiClient.get('/teacher/analytics/question-exposure')),
  getReports: async (params) => unwrap(await apiClient.get('/teacher/analytics/reports', { params })),
  getAttemptReview: async (attemptId) =>
    unwrap(await apiClient.get(`/teacher/analytics/attempts/${attemptId}/review`)),
  exportReport: async (payload) => unwrap(await apiClient.post('/teacher/reports/export', payload)),
};

import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const weeklyPlanService = {
  list: async (params = {}) => unwrap(await apiClient.get('/teacher/weekly-plans', { params })),
  create: async (payload) => unwrap(await apiClient.post('/teacher/weekly-plans', payload)),
  update: async (id, payload) => unwrap(await apiClient.put(`/teacher/weekly-plans/${id}`, payload)),
  remove: async (id) => unwrap(await apiClient.delete(`/teacher/weekly-plans/${id}`)),
};

import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const authService = {
  login: async (payload) => {
    const response = await apiClient.post('/auth/login', payload);
    return unwrap(response);
  },
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return unwrap(response);
  },
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return unwrap(response);
  },
  verify: async () => {
    const response = await apiClient.get('/auth/verify');
    return unwrap(response);
  },
  changePassword: async (payload) => {
    const response = await apiClient.put('/auth/change-password', payload);
    return unwrap(response);
  },
  forgotPassword: async (payload) => {
    const response = await apiClient.post('/auth/forgot-password', payload);
    return unwrap(response);
  },
  resetPassword: async (payload) => {
    const response = await apiClient.post('/auth/reset-password', payload);
    return unwrap(response);
  },
};

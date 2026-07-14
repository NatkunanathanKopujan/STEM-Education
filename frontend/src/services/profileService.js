import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const profileService = {
  getProfile: async () => unwrap(await apiClient.get('/profile')),
  updateProfile: async (payload) => unwrap(await apiClient.put('/profile', payload)),
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return unwrap(
      await apiClient.post('/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  removePhoto: async () => unwrap(await apiClient.delete('/profile/photo')),
  changePassword: async (payload) => unwrap(await apiClient.put('/profile/change-password', payload)),
  getLoginHistory: async (params) => unwrap(await apiClient.get('/profile/login-history', { params })),
  getSessions: async () => unwrap(await apiClient.get('/profile/sessions')),
  deleteSession: async (id) => unwrap(await apiClient.delete(`/profile/sessions/${id}`)),
  deleteSessions: async (payload) => unwrap(await apiClient.delete('/profile/sessions', { data: payload })),
  getPreferences: async () => unwrap(await apiClient.get('/profile/preferences')),
  updatePreferences: async (payload) => unwrap(await apiClient.put('/profile/preferences', payload)),
};

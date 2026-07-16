import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

function compactValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const settingsService = {
  list: async (params) => unwrap(await apiClient.get('/settings', { params: compactValues(params) })),
  get: async (settingKey) => unwrap(await apiClient.get(`/settings/${settingKey}`)),
  create: async (payload) => unwrap(await apiClient.post('/settings', payload)),
  update: async (settingKey, payload) => unwrap(await apiClient.put(`/settings/${settingKey}`, payload)),
  saveMany: async (settings) => unwrap(await apiClient.put('/settings', { settings })),
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return unwrap(
      await apiClient.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  remove: async (settingKey) => unwrap(await apiClient.delete(`/settings/${settingKey}`)),
};

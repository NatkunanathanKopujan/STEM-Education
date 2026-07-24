import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

function compactValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const notificationService = {
  getNotifications: async (params) => unwrap(await apiClient.get('/notifications', { params: compactValues(params) })),
  getUnread: async () => unwrap(await apiClient.get('/notifications/unread')),
  markRead: async (ids) => unwrap(await apiClient.post('/notifications/read', { ids })),
  markAllRead: async () => unwrap(await apiClient.post('/notifications/read-all')),
  deleteNotification: async (id) => unwrap(await apiClient.delete(`/notifications/${id}`)),
  getAnnouncements: async (params) => unwrap(await apiClient.get('/announcements', { params: compactValues(params) })),
  getAnnouncement: async (id) => unwrap(await apiClient.get(`/announcements/${id}`)),
  createAnnouncement: async (payload) => unwrap(await apiClient.post('/announcements', payload)),
  updateAnnouncement: async (id, payload) => unwrap(await apiClient.put(`/announcements/${id}`, payload)),
  deleteAnnouncement: async (id) => unwrap(await apiClient.delete(`/announcements/${id}`)),
  getPreferences: async () => unwrap(await apiClient.get('/notification-preferences')),
  updatePreferences: async (payload) => unwrap(await apiClient.put('/notification-preferences', payload)),
  resetPreferences: async () => unwrap(await apiClient.delete('/notification-preferences')),
};

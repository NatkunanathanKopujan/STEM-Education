import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

function compactValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function buildAnnouncementFormData(payload = {}, files = []) {
  const formData = new FormData();
  Object.entries(compactValues(payload)).forEach(([key, value]) => {
    formData.append(key, Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : value);
  });
  files.forEach((file) => formData.append('attachments', file));
  return formData;
}

export const notificationService = {
  getNotifications: async (params) => unwrap(await apiClient.get('/notifications', { params: compactValues(params) })),
  getUnread: async () => unwrap(await apiClient.get('/notifications/unread')),
  markRead: async (ids) => unwrap(await apiClient.post('/notifications/read', { ids })),
  markUnread: async (ids) => unwrap(await apiClient.post('/notifications/unread', { ids })),
  markAllRead: async () => unwrap(await apiClient.post('/notifications/read-all')),
  deleteNotification: async (id) => unwrap(await apiClient.delete(`/notifications/${id}`)),
  getAnnouncements: async (params) => unwrap(await apiClient.get('/announcements', { params: compactValues(params) })),
  getAnnouncement: async (id) => unwrap(await apiClient.get(`/announcements/${id}`)),
  previewAnnouncementAttachment: async (announcementId, attachmentId) => {
    const response = await apiClient.get(`/announcements/${announcementId}/attachments/${attachmentId}/preview`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },
  createAnnouncement: async (payload, files = []) => {
    if (files.length) {
      return unwrap(await apiClient.post('/announcements', buildAnnouncementFormData(payload, files), {
        headers: { 'Content-Type': 'multipart/form-data' },
      }));
    }
    return unwrap(await apiClient.post('/announcements', payload));
  },
  updateAnnouncement: async (id, payload) => unwrap(await apiClient.put(`/announcements/${id}`, payload)),
  deleteAnnouncement: async (id) => unwrap(await apiClient.delete(`/announcements/${id}`)),
  getPreferences: async () => unwrap(await apiClient.get('/notification-preferences')),
  updatePreferences: async (payload) => unwrap(await apiClient.put('/notification-preferences', payload)),
  resetPreferences: async () => unwrap(await apiClient.delete('/notification-preferences')),
};

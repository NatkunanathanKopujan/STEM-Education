import { apiClient } from './apiClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const calendarNoteService = {
  list: async (params) => unwrap(await apiClient.get('/calendar-notes', { params })),
  save: async (noteDate, note) => unwrap(await apiClient.put(`/calendar-notes/${noteDate}`, { note })),
  remove: async (noteDate) => unwrap(await apiClient.delete(`/calendar-notes/${noteDate}`)),
};

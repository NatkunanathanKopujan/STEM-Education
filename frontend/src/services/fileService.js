import { apiClient } from './apiClient';

function compactValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const fileService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/files', { params: compactValues(params) });
    return data.data;
  },

  async statistics() {
    const { data } = await apiClient.get('/files/storage/statistics');
    return data.data;
  },

  async upload(file, metadata = {}, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== '') formData.append(key, value);
    });

    const { data } = await apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return data.data;
  },

  async uploadMultiple(files, metadata = {}, onUploadProgress) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== '') formData.append(key, value);
    });

    const { data } = await apiClient.post('/files/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return data.data;
  },

  async update(id, payload) {
    const { data } = await apiClient.put(`/files/${id}`, compactValues(payload));
    return data.data;
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/files/${id}`);
    return data.data;
  },

  async history(id) {
    const { data } = await apiClient.get(`/files/history/${id}`);
    return data.data;
  },

  async restoreVersion(versionId) {
    const { data } = await apiClient.post(`/files/restore-version/${versionId}`);
    return data.data;
  },

  async previewBlob(id) {
    const response = await apiClient.get(`/files/preview/${id}`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },

  async downloadBlob(id) {
    const response = await apiClient.get(`/files/download/${id}`, { responseType: 'blob' });
    return response.data;
  },
};

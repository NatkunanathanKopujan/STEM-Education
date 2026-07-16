import { apiClient } from './apiClient';

function compactValues(values = {}) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export const securityService = {
  async dashboard() {
    const { data } = await apiClient.get('/security/dashboard');
    return data.data;
  },

  async auditLogs(params = {}) {
    const { data } = await apiClient.get('/security/audit-logs', { params: compactValues(params) });
    return data.data;
  },

  async alerts(params = {}) {
    const { data } = await apiClient.get('/security/alerts', { params: compactValues(params) });
    return data.data;
  },

  async loginHistory(params = {}) {
    const { data } = await apiClient.get('/security/login-history', { params: compactValues(params) });
    return data.data;
  },

  async lockUser(userId) {
    const { data } = await apiClient.post('/security/lock-user', { userId });
    return data.data;
  },

  async unlockUser(userId) {
    const { data } = await apiClient.post('/security/unlock-user', { userId });
    return data.data;
  },

  async backup(payload = {}) {
    const { data } = await apiClient.post('/security/backup', payload);
    return data.data;
  },

  async backups(params = {}) {
    const { data } = await apiClient.get('/security/backups', { params: compactValues(params) });
    return data.data;
  },

  async restore(payload = {}) {
    const { data } = await apiClient.post('/security/restore', payload);
    return data.data;
  },

  async restores(params = {}) {
    const { data } = await apiClient.get('/security/restores', { params: compactValues(params) });
    return data.data;
  },

  async systemHealth() {
    const { data } = await apiClient.get('/security/system-health');
    return data.data;
  },
};

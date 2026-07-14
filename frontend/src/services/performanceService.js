import { apiClient } from './apiClient';

export const performanceService = {
  async dashboard() {
    const { data } = await apiClient.get('/performance/dashboard');
    return data.data;
  },
};

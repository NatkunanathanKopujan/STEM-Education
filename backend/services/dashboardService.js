import {
  getDashboardSummary,
  listDashboardCurriculums,
  listDashboardUsers,
} from '../repositories/dashboardRepository.js';

export const dashboardService = {
  getSummary: getDashboardSummary,
  listUsers: async () => ({ users: await listDashboardUsers() }),
  listCurriculums: async () => ({ curriculums: await listDashboardCurriculums() }),
};

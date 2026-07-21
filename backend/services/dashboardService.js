import {
  getDashboardSummary,
  listDashboardCurriculums,
  listDashboardUsers,
} from '../repositories/dashboardRepository.js';

export const dashboardService = {
  getSummary: (user) => getDashboardSummary(user),
  listUsers: async () => ({ users: await listDashboardUsers() }),
  listCurriculums: async () => ({ curriculums: await listDashboardCurriculums() }),
};

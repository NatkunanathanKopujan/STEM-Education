import {
  getDashboardSummary,
  listDashboardCurriculums,
  listDashboardUsers,
} from '../repositories/dashboardRepository.js';

export const dashboardService = {
  getSummary: (user) => getDashboardSummary(user),
  listUsers: async (user) => ({ users: await listDashboardUsers(user) }),
  listCurriculums: async (user) => ({ curriculums: await listDashboardCurriculums(user) }),
};

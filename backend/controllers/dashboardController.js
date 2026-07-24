import { dashboardService } from '../services/dashboardService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const dashboardController = {
  summary: async (req, res, next) => {
    try {
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, await dashboardService.getSummary(req.user), 'Dashboard summary fetched');
    } catch (error) {
      return next(error);
    }
  },

  users: async (req, res, next) => {
    try {
      return sendSuccess(res, await dashboardService.listUsers(req.user), 'Dashboard users fetched');
    } catch (error) {
      return next(error);
    }
  },

  curriculums: async (req, res, next) => {
    try {
      return sendSuccess(res, await dashboardService.listCurriculums(req.user), 'Dashboard curriculums fetched');
    } catch (error) {
      return next(error);
    }
  },
};

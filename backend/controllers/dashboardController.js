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

  users: async (_req, res, next) => {
    try {
      return sendSuccess(res, await dashboardService.listUsers(), 'Dashboard users fetched');
    } catch (error) {
      return next(error);
    }
  },

  curriculums: async (_req, res, next) => {
    try {
      return sendSuccess(res, await dashboardService.listCurriculums(), 'Dashboard curriculums fetched');
    } catch (error) {
      return next(error);
    }
  },
};

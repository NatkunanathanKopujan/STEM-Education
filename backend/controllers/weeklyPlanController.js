import {
  createWeeklyPlan,
  deleteWeeklyPlan,
  getWeeklyPlans,
  updateWeeklyPlan,
} from '../services/weeklyPlanService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const weeklyPlanController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await getWeeklyPlans(req.user, req.query), 'Weekly teaching plans fetched');
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      return sendSuccess(res, await createWeeklyPlan(req.user, req.body), 'Weekly teaching plan created', 201);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await updateWeeklyPlan(req.user, Number(req.params.id), req.body),
        'Weekly teaching plan updated',
      );
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await deleteWeeklyPlan(req.user, Number(req.params.id)),
        'Weekly teaching plan deleted',
      );
    } catch (error) {
      return next(error);
    }
  },
};

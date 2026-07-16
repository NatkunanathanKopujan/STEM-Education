import { getQuizReport } from '../repositories/reportsRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

export const resultController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await getQuizReport(req.user, req.query), 'Results fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      const report = await getQuizReport(req.user, { quizNumber: req.params.id });
      return sendSuccess(res, report, 'Result fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  create: async (_req, _res, next) => {
    return next(new AppError('Results are created by submitting and grading quiz attempts', 405));
  },

  update: async (_req, _res, next) => {
    return next(new AppError('Results cannot be edited from this endpoint', 405));
  },

  remove: async (_req, _res, next) => {
    return next(new AppError('Results cannot be deleted from this endpoint', 405));
  },
};

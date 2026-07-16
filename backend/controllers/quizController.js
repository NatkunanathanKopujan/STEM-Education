import { getQuizReport } from '../repositories/reportsRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

export const quizController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await getQuizReport(req.user, req.query), 'Quiz analytics fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      const report = await getQuizReport(req.user, { quizNumber: req.params.id });
      return sendSuccess(res, report, 'Quiz details fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  create: async (_req, _res, next) => {
    return next(new AppError('Use /api/student/quiz/start and AI question generation APIs for quiz creation', 405));
  },

  update: async (_req, _res, next) => {
    return next(new AppError('Quiz attempts are immutable after submission', 405));
  },

  remove: async (_req, _res, next) => {
    return next(new AppError('Quiz attempts cannot be deleted from this endpoint', 405));
  },
};

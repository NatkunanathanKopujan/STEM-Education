import {
  addAcademicYear,
  getAcademicYear,
  getAcademicYears,
  removeAcademicYear,
  saveAcademicYear,
} from '../services/academicYearService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const academicYearController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await getAcademicYears(req.query), 'Academic years fetched');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      return sendSuccess(res, await getAcademicYear(req.params.id), 'Academic year fetched');
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await addAcademicYear(req.user, req.body, req),
        'Academic year created',
        201,
      );
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await saveAcademicYear(req.user, req.params.id, req.body, req),
        'Academic year updated',
      );
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await removeAcademicYear(req.user, req.params.id, req),
        'Academic year deleted',
      );
    } catch (error) {
      return next(error);
    }
  },
};

import { superAdminService } from '../services/superAdminService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const superAdminController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await superAdminService.list(req.query),
        'Admins fetched successfully',
      );
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await superAdminService.findById(req.params.id),
        'Admin fetched successfully',
      );
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await superAdminService.create(req.body),
        'Admin created successfully',
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
        await superAdminService.update(req.params.id, req.body),
        'Admin updated successfully',
      );
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await superAdminService.remove(req.params.id),
        'Admin deleted successfully',
      );
    } catch (error) {
      return next(error);
    }
  },
};

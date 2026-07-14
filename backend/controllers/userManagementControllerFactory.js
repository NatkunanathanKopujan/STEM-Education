import { sendSuccess } from '../utils/apiResponse.js';

export function createUserManagementController(service, label) {
  return {
    index: async (req, res, next) => {
      try {
        return sendSuccess(res, await service.list(req.query), `${label}s fetched successfully`);
      } catch (error) {
        return next(error);
      }
    },

    show: async (req, res, next) => {
      try {
        return sendSuccess(res, await service.findById(req.params.id), `${label} fetched successfully`);
      } catch (error) {
        return next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        return sendSuccess(res, await service.create(req.body), `${label} created successfully`, 201);
      } catch (error) {
        return next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        return sendSuccess(res, await service.update(req.params.id, req.body), `${label} updated successfully`);
      } catch (error) {
        return next(error);
      }
    },

    remove: async (req, res, next) => {
      try {
        return sendSuccess(res, await service.remove(req.params.id), `${label} deleted successfully`);
      } catch (error) {
        return next(error);
      }
    },
  };
}

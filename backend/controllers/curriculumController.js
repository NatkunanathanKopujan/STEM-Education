import { curriculumService } from '../services/curriculumService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const curriculumController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await curriculumService.list(req.query), 'Curriculums fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      return sendSuccess(res, await curriculumService.findById(req.params.id), 'Curriculum fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      return sendSuccess(res, await curriculumService.create(req.body, req.user), 'Curriculum created successfully', 201);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      return sendSuccess(res, await curriculumService.update(req.params.id, req.body), 'Curriculum updated successfully');
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      return sendSuccess(res, await curriculumService.remove(req.params.id), 'Curriculum deleted successfully');
    } catch (error) {
      return next(error);
    }
  },
};

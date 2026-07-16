import { getFile, getFiles, removeFile, updateFile } from '../services/fileService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

export const materialController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await getFiles(req.user, req.query), 'Materials fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      return sendSuccess(res, await getFile(req.user, req.params.id), 'Material fetched successfully');
    } catch (error) {
      return next(error);
    }
  },

  create: async (_req, _res, next) => {
    return next(new AppError('Use /api/files/upload to create material records with an uploaded file', 405));
  },

  update: async (req, res, next) => {
    try {
      return sendSuccess(res, await updateFile(req.user, req.params.id, req.body), 'Material updated successfully');
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      return sendSuccess(res, await removeFile(req.user, req.params.id), 'Material deleted successfully');
    } catch (error) {
      return next(error);
    }
  },
};

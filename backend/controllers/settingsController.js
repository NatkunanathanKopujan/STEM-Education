import {
  addSetting,
  getSetting,
  getSettings,
  removeSetting,
  saveSetting,
  saveSettings,
  uploadSystemLogo,
} from '../services/settingsService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const settingsController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await getSettings(req.query), 'Settings fetched');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      return sendSuccess(res, await getSetting(req.params.settingKey), 'Setting fetched');
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      return sendSuccess(res, await addSetting(req.user, req.body, req), 'Setting created', 201);
    } catch (error) {
      return next(error);
    }
  },

  bulkUpdate: async (req, res, next) => {
    try {
      return sendSuccess(res, await saveSettings(req.user, req.body, req), 'Settings saved');
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await saveSetting(req.user, req.params.settingKey, req.body, req),
        'Setting updated',
      );
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await removeSetting(req.user, req.params.settingKey, req),
        'Setting deleted',
      );
    } catch (error) {
      return next(error);
    }
  },

  uploadLogo: async (req, res, next) => {
    try {
      return sendSuccess(res, await uploadSystemLogo(req.user, req.file, req), 'System logo uploaded');
    } catch (error) {
      return next(error);
    }
  },
};

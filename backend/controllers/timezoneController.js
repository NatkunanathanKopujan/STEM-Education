import {
  addTimezone,
  getTimezone,
  getTimezones,
  removeTimezone,
  saveTimezone,
} from '../services/timezoneService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const timezoneController = {
  index: async (req, res, next) => {
    try {
      return sendSuccess(res, await getTimezones(req.query), 'Timezones fetched');
    } catch (error) {
      return next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      return sendSuccess(res, await getTimezone(req.params.id), 'Timezone fetched');
    } catch (error) {
      return next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      return sendSuccess(res, await addTimezone(req.user, req.body, req), 'Timezone created', 201);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await saveTimezone(req.user, req.params.id, req.body, req),
        'Timezone updated',
      );
    } catch (error) {
      return next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      return sendSuccess(
        res,
        await removeTimezone(req.user, req.params.id, req),
        'Timezone deleted',
      );
    } catch (error) {
      return next(error);
    }
  },
};

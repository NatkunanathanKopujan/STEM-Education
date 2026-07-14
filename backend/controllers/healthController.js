import {
  aiHealth,
  databaseHealth,
  overallHealth,
  storageHealth,
  systemHealth,
} from '../services/healthService.js';
import { sendSuccess } from '../utils/apiResponse.js';

function statusCodeFor(health) {
  return health.status === 'error' || health.status === 'degraded' ? 503 : 200;
}

export const healthController = {
  async overall(_req, res) {
    const health = await overallHealth();
    return sendSuccess(res, health, 'Success');
  },

  async database(_req, res) {
    const health = await databaseHealth();
    return sendSuccess(res, health, 'Database health fetched', statusCodeFor(health));
  },

  async storage(_req, res) {
    const health = await storageHealth();
    return sendSuccess(res, health, 'Storage health fetched', statusCodeFor(health));
  },

  async ai(_req, res) {
    const health = await aiHealth();
    return sendSuccess(res, health, 'AI health fetched');
  },

  async system(_req, res) {
    const health = await systemHealth();
    return sendSuccess(res, health, 'System health fetched');
  },
};

import { sendSuccess } from '../utils/apiResponse.js';
import { getPerformanceDashboard } from '../services/performanceService.js';

export const performanceController = {
  async dashboard(req, res) {
    return sendSuccess(res, await getPerformanceDashboard(req.user), 'Performance dashboard fetched');
  },
};

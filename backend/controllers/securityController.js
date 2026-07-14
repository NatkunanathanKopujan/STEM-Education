import { sendSuccess } from '../utils/apiResponse.js';
import {
  getActivity,
  getAlerts,
  getAuditLogs,
  getBackups,
  getLoginHistory,
  getRestoreHistory,
  getSecurityOverview,
  getSystemHealth,
  lockUser,
  restoreBackup,
  runBackup,
  unlockUser,
} from '../services/securityService.js';

const requestMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
});

export const securityController = {
  async dashboard(req, res) {
    return sendSuccess(res, await getSecurityOverview(req.user), 'Security dashboard fetched');
  },

  async auditLogs(req, res) {
    return sendSuccess(res, await getAuditLogs(req.user, req.query), 'Audit logs fetched');
  },

  async activity(req, res) {
    return sendSuccess(res, await getActivity(req.user, req.query), 'Activity timeline fetched');
  },

  async alerts(req, res) {
    return sendSuccess(res, await getAlerts(req.user, req.query), 'Security alerts fetched');
  },

  async loginHistory(req, res) {
    return sendSuccess(res, await getLoginHistory(req.user, req.query), 'Login history fetched');
  },

  async lockUser(req, res) {
    return sendSuccess(res, await lockUser(req.user, req.body.userId, requestMeta(req)), 'User locked');
  },

  async unlockUser(req, res) {
    return sendSuccess(res, await unlockUser(req.user, req.body.userId, requestMeta(req)), 'User unlocked');
  },

  async backup(req, res) {
    return sendSuccess(res, await runBackup(req.user, req.body, requestMeta(req)), 'Backup completed', 201);
  },

  async backups(req, res) {
    return sendSuccess(res, await getBackups(req.user, req.query), 'Backup history fetched');
  },

  async restore(req, res) {
    return sendSuccess(res, await restoreBackup(req.user, req.body, requestMeta(req)), 'Restore completed');
  },

  async restores(req, res) {
    return sendSuccess(res, await getRestoreHistory(req.user, req.query), 'Restore history fetched');
  },

  async systemHealth(req, res) {
    return sendSuccess(res, await getSystemHealth(req.user), 'System health fetched');
  },
};

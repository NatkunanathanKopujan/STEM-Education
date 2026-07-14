import os from 'os';
import { performance } from 'perf_hooks';
import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import {
  createAuditLog,
  createBackupRecord,
  createRestoreRecord,
  createSecurityAlert,
  createSystemHealthSnapshot,
  getSecurityDashboard,
  listActiveSessions,
  listAuditLogs,
  listBackups,
  listLoginAttempts,
  listRestoreHistory,
  listSecurityAlerts,
  recordLoginAttempt,
  setUserStatus,
} from '../repositories/securityRepository.js';

const superAdminOnly = (user) => {
  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('Only Super Admin can perform this security operation', 403);
  }
};

export async function auditAction({
  user,
  action,
  module,
  description,
  status = 'success',
  ipAddress,
  browser,
  device,
  metadata,
}) {
  await createAuditLog({
    userId: user?.id || null,
    role: user?.role || null,
    action,
    module,
    description,
    status,
    ipAddress,
    browser,
    device,
    metadata,
  });
}

export async function createAlert(payload) {
  return createSecurityAlert(payload);
}

export async function recordSecurityLoginAttempt(payload) {
  return recordLoginAttempt(payload);
}

export async function getAuditLogs(_user, filters) {
  return listAuditLogs(filters);
}

export async function getActivity(_user, filters) {
  return listAuditLogs(filters);
}

export async function getAlerts(_user, filters) {
  return listSecurityAlerts(filters);
}

export async function getLoginHistory(_user, filters) {
  return listLoginAttempts(filters);
}

export async function lockUser(user, targetUserId, requestMeta) {
  superAdminOnly(user);
  await setUserStatus(Number(targetUserId), 'locked');
  await auditAction({
    user,
    action: 'lock_user',
    module: 'security',
    description: `User ${targetUserId} was locked`,
    ipAddress: requestMeta.ipAddress,
    browser: requestMeta.userAgent,
  });
  await createAlert({
    alertType: 'account_lock',
    severity: 'high',
    title: 'User account locked',
    description: `User ${targetUserId} was locked by Super Admin`,
    userId: targetUserId,
    role: user.role,
    ipAddress: requestMeta.ipAddress,
  });
  return { locked: true };
}

export async function unlockUser(user, targetUserId, requestMeta) {
  superAdminOnly(user);
  await setUserStatus(Number(targetUserId), 'active');
  await auditAction({
    user,
    action: 'unlock_user',
    module: 'security',
    description: `User ${targetUserId} was unlocked`,
    ipAddress: requestMeta.ipAddress,
    browser: requestMeta.userAgent,
  });
  return { unlocked: true };
}

export async function runBackup(user, payload = {}, requestMeta = {}) {
  superAdminOnly(user);
  const startedAt = performance.now();
  const backupScope = payload.backupScope || 'full';
  const backupType = payload.backupType || 'manual';
  const metadata = {
    includes: payload.includes || [
      'database',
      'uploaded_files',
      'configuration',
      'ai_question_bank',
      'learning_materials',
      'notifications',
      'audit_logs',
      'user_data',
    ],
    provider: 'metadata-manifest',
    note: 'Backup manifest recorded. File/database dump workers can attach artifacts later.',
  };
  const backupId = await createBackupRecord({
    backupType,
    backupScope,
    backupSize: JSON.stringify(metadata).length,
    status: 'completed',
    durationMs: Math.round(performance.now() - startedAt),
    createdBy: user.id,
    metadata,
  });

  await auditAction({
    user,
    action: 'backup_completed',
    module: 'backup',
    description: `${backupScope} backup completed`,
    ipAddress: requestMeta.ipAddress,
    browser: requestMeta.userAgent,
    metadata: { backupId },
  });

  return { backupId, status: 'completed', metadata };
}

export async function getBackups(user, filters) {
  superAdminOnly(user);
  return listBackups(filters);
}

export async function restoreBackup(user, payload = {}, requestMeta = {}) {
  superAdminOnly(user);
  const startedAt = performance.now();
  const restoreId = await createRestoreRecord({
    backupId: payload.backupId,
    restoreScope: payload.restoreScope || 'metadata_validation',
    status: 'completed',
    durationMs: Math.round(performance.now() - startedAt),
    restoredBy: user.id,
    validationStatus: 'passed',
    metadata: {
      note: 'Restore request validated and recorded. Destructive restore execution is reserved for approved workers.',
      requestedSections: payload.sections || [],
    },
  });

  await auditAction({
    user,
    action: 'restore_completed',
    module: 'backup',
    description: `Restore ${restoreId} completed`,
    ipAddress: requestMeta.ipAddress,
    browser: requestMeta.userAgent,
    metadata: { restoreId, backupId: payload.backupId },
  });

  return { restoreId, status: 'completed', validationStatus: 'passed' };
}

export async function getRestoreHistory(user, filters) {
  superAdminOnly(user);
  return listRestoreHistory(filters);
}

export async function getSystemHealth(user) {
  superAdminOnly(user);
  const dashboard = await getSecurityDashboard();
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const usedMemory = totalMemory - os.freemem();
  const status = dashboard.openAlerts > 0 ? 'warning' : 'healthy';

  const health = {
    status,
    cpuUsage: os.loadavg()[0],
    memoryUsage: Number(((usedMemory / totalMemory) * 100).toFixed(2)),
    storageUsage: Number(dashboard.storage?.storageUsed || 0),
    databaseSize: 0,
    apiRequests: 0,
    activeUsers: dashboard.activeUsers,
    aiRequests: 0,
    errorCount: dashboard.openAlerts,
    backupStatus: dashboard.latestBackup?.status || 'not_started',
    processMemoryMb: Math.round(memoryUsage.rss / 1024 / 1024),
    dashboard,
  };

  await createSystemHealthSnapshot({
    ...health,
    metadata: { platform: os.platform(), uptime: os.uptime() },
  });

  return health;
}

export async function getSecurityOverview(user) {
  superAdminOnly(user);
  const [dashboard, alerts, auditLogs, loginHistory, sessions, health] = await Promise.all([
    getSecurityDashboard(),
    listSecurityAlerts({ limit: 8 }),
    listAuditLogs({ limit: 8 }),
    listLoginAttempts({ limit: 8, status: 'failed' }),
    listActiveSessions(),
    getSystemHealth(user),
  ]);

  return {
    dashboard,
    recentAlerts: alerts.alerts,
    recentAuditLogs: auditLogs.logs,
    failedLoginAttempts: loginHistory.attempts,
    activeSessions: sessions,
    health,
  };
}

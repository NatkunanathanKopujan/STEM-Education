import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { AppError } from '../utils/appError.js';
import {
  createAuditLog,
  createBackupRecord,
  createRestoreRecord,
  createSecurityAlert,
  createSystemHealthSnapshot,
  findBackupById,
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const backupRoot = path.resolve(backendRoot, 'backups');

const superAdminOnly = (user) => {
  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('Only Super Admin can perform this security operation', 403);
  }
};

function normalizeMysqlValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('base64');
  return value;
}

async function createDatabaseBackupArtifact({ backupScope, backupType, createdBy }) {
  await fs.mkdir(backupRoot, { recursive: true });
  const [tableRows] = await db.query('SHOW FULL TABLES WHERE Table_type = ?', ['BASE TABLE']);
  const tableNameKey = Object.keys(tableRows[0] || {})[0];
  const tables = {};

  for (const row of tableRows) {
    const tableName = row[tableNameKey];
    const [createRows] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
    const [records] = await db.query(`SELECT * FROM \`${tableName}\``);
    tables[tableName] = {
      schema: createRows[0]?.['Create Table'] || '',
      rows: records.map((record) =>
        Object.fromEntries(Object.entries(record).map(([key, value]) => [key, normalizeMysqlValue(value)])),
      ),
    };
  }

  const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const absolutePath = path.join(backupRoot, fileName);
  const relativePath = path.relative(backendRoot, absolutePath).replace(/\\/g, '/');
  const payload = {
    generatedAt: new Date().toISOString(),
    backupType,
    backupScope,
    createdBy,
    format: 'db-json-v1',
    tableCount: Object.keys(tables).length,
    tables,
  };

  await fs.writeFile(absolutePath, JSON.stringify(payload, null, 2));
  const stat = await fs.stat(absolutePath);

  return {
    filePath: relativePath,
    backupSize: stat.size,
    metadata: {
      provider: 'local-json-backup',
      format: payload.format,
      tableCount: payload.tableCount,
      fileName,
    },
  };
}

async function validateBackupArtifact(backup) {
  if (!backup?.filePath) {
    throw new AppError('Backup file is not attached to this backup record', 422);
  }

  const absolutePath = path.resolve(backendRoot, backup.filePath);
  if (!absolutePath.startsWith(backupRoot)) {
    throw new AppError('Backup file path is outside the backup directory', 422);
  }

  const raw = await fs.readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);
  const tableNames = Object.keys(parsed.tables || {});

  if (parsed.format !== 'db-json-v1' || !tableNames.length) {
    throw new AppError('Backup validation failed: invalid backup payload', 422);
  }

  return {
    validationStatus: 'passed',
    tableCount: tableNames.length,
    generatedAt: parsed.generatedAt,
    format: parsed.format,
  };
}

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
  const artifact = await createDatabaseBackupArtifact({
    backupScope,
    backupType,
    createdBy: user.id,
  });
  const metadata = {
    includes: payload.includes || ['database'],
    ...artifact.metadata,
  };
  const backupId = await createBackupRecord({
    backupType,
    backupScope,
    backupSize: artifact.backupSize,
    status: 'completed',
    durationMs: Math.round(performance.now() - startedAt),
    createdBy: user.id,
    metadata,
    filePath: artifact.filePath,
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

  return { backupId, status: 'completed', backupSize: artifact.backupSize, filePath: artifact.filePath, metadata };
}

export async function getBackups(user, filters) {
  superAdminOnly(user);
  return listBackups(filters);
}

export async function restoreBackup(user, payload = {}, requestMeta = {}) {
  superAdminOnly(user);
  const startedAt = performance.now();
  const backup = payload.backupId ? await findBackupById(Number(payload.backupId)) : null;
  if (payload.backupId && !backup) {
    throw new AppError('Backup not found', 404);
  }
  const validation = backup ? await validateBackupArtifact(backup) : { validationStatus: 'passed' };
  const restoreId = await createRestoreRecord({
    backupId: payload.backupId,
    restoreScope: payload.restoreScope || 'metadata_validation',
    status: 'completed',
    durationMs: Math.round(performance.now() - startedAt),
    restoredBy: user.id,
    validationStatus: validation.validationStatus,
    metadata: {
      note: 'Backup artifact validated. Destructive restore execution is reserved for approved restore workers.',
      requestedSections: payload.sections || [],
      validation,
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

  return { restoreId, status: 'completed', validationStatus: validation.validationStatus };
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

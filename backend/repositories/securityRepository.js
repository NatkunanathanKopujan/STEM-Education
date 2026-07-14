import { db } from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

function limitOffset({ page = 1, limit = 25 }) {
  const safeLimit = Math.min(Number(limit || 25), 100);
  const safePage = Math.max(Number(page || 1), 1);
  return { limit: safeLimit, offset: (safePage - 1) * safeLimit, page: safePage };
}

function applyCommonFilters(filters, where, values, alias = '') {
  const prefix = alias ? `${alias}.` : '';

  for (const [key, column] of [
    ['role', 'role'],
    ['module', 'module'],
    ['action', 'action'],
    ['status', 'status'],
  ]) {
    if (filters[key]) {
      where.push(`${prefix}${column} = ?`);
      values.push(filters[key]);
    }
  }

  if (filters.userId) {
    where.push(`${prefix}user_id = ?`);
    values.push(Number(filters.userId));
  }

  if (filters.dateFrom) {
    where.push(`DATE(${prefix}created_at) >= ?`);
    values.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    where.push(`DATE(${prefix}created_at) <= ?`);
    values.push(filters.dateTo);
  }
}

export async function createAuditLog(payload) {
  await db.execute(
    `INSERT INTO audit_logs
      (uuid, user_id, role, action, module, description, ip_address, browser, device, status, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.userId || null,
      payload.role || null,
      payload.action,
      payload.module,
      payload.description,
      payload.ipAddress || null,
      payload.browser || null,
      payload.device || null,
      payload.status || 'success',
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
}

export async function listAuditLogs(filters = {}) {
  const { limit, offset, page } = limitOffset(filters);
  const where = [];
  const values = [];
  applyCommonFilters(filters, where, values, 'a');

  if (filters.search) {
    where.push('(a.description LIKE ? OR a.action LIKE ? OR a.module LIKE ? OR u.full_name LIKE ?)');
    const term = `%${filters.search}%`;
    values.push(term, term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT a.id, a.uuid, a.user_id AS userId, u.full_name AS userName, a.role, a.action,
      a.module, a.description, a.ip_address AS ipAddress, a.browser, a.device, a.status,
      a.metadata, a.created_at AS createdAt
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${whereSql}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ${whereSql}`,
    values,
  );

  return { logs: rows, total: countRows[0]?.total || 0, page, limit };
}

export async function createSecurityAlert(payload) {
  await db.execute(
    `INSERT INTO security_alerts
      (uuid, alert_type, severity, title, description, user_id, role, source_module, ip_address, status, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.alertType,
      payload.severity || 'medium',
      payload.title,
      payload.description,
      payload.userId || null,
      payload.role || null,
      payload.sourceModule || 'security',
      payload.ipAddress || null,
      payload.status || 'open',
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
}

export async function listSecurityAlerts(filters = {}) {
  const { limit, offset, page } = limitOffset(filters);
  const where = [];
  const values = [];

  for (const [key, column] of [
    ['role', 'role'],
    ['status', 'status'],
    ['severity', 'severity'],
  ]) {
    if (filters[key]) {
      where.push(`s.${column} = ?`);
      values.push(filters[key]);
    }
  }

  if (filters.module) {
    where.push('s.source_module = ?');
    values.push(filters.module);
  }

  if (filters.userId) {
    where.push('s.user_id = ?');
    values.push(Number(filters.userId));
  }

  if (filters.dateFrom) {
    where.push('DATE(s.created_at) >= ?');
    values.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    where.push('DATE(s.created_at) <= ?');
    values.push(filters.dateTo);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT s.id, s.uuid, s.alert_type AS alertType, s.severity, s.title, s.description,
      s.user_id AS userId, u.full_name AS userName, s.role, s.source_module AS sourceModule,
      s.ip_address AS ipAddress, s.status, s.metadata, s.created_at AS createdAt, s.resolved_at AS resolvedAt
     FROM security_alerts s
     LEFT JOIN users u ON u.id = s.user_id
     ${whereSql}
     ORDER BY FIELD(s.severity, 'critical', 'high', 'medium', 'low'), s.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await db.execute(`SELECT COUNT(*) AS total FROM security_alerts s ${whereSql}`, values);

  return { alerts: rows, total: countRows[0]?.total || 0, page, limit };
}

export async function recordLoginAttempt(payload) {
  await db.execute(
    `INSERT INTO login_attempts
      (user_id, identifier, status, failure_reason, ip_address, browser, operating_system, device_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.userId || null,
      payload.identifier,
      payload.status,
      payload.failureReason || null,
      payload.ipAddress || null,
      payload.browser || null,
      payload.operatingSystem || null,
      payload.deviceInfo ? JSON.stringify(payload.deviceInfo) : null,
    ],
  );
}

export async function recordPermissionCheck(payload) {
  await db.execute(
    `INSERT INTO permission_logs
      (user_id, role, permission, resource, allowed, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.userId || null,
      payload.role || null,
      payload.permission,
      payload.resource || null,
      payload.allowed ? 1 : 0,
      payload.ipAddress || null,
    ],
  );
}

export async function countRecentFailedAttempts(identifier, windowMinutes) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS failedCount
     FROM login_attempts
     WHERE identifier = ? AND status = 'failed'
       AND attempted_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [identifier, windowMinutes],
  );

  return rows[0]?.failedCount || 0;
}

export async function listLoginAttempts(filters = {}) {
  const { limit, offset, page } = limitOffset(filters);
  const where = [];
  const values = [];

  if (filters.status) {
    where.push('l.status = ?');
    values.push(filters.status);
  }
  if (filters.userId) {
    where.push('l.user_id = ?');
    values.push(Number(filters.userId));
  }
  if (filters.search) {
    where.push('(l.identifier LIKE ? OR u.full_name LIKE ? OR l.ip_address LIKE ?)');
    const term = `%${filters.search}%`;
    values.push(term, term, term);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT l.id, l.user_id AS userId, u.full_name AS userName, l.identifier, l.status,
      l.failure_reason AS failureReason, l.ip_address AS ipAddress, l.browser,
      l.operating_system AS operatingSystem, l.device_info AS deviceInfo, l.attempted_at AS attemptedAt
     FROM login_attempts l
     LEFT JOIN users u ON u.id = l.user_id
     ${whereSql}
     ORDER BY l.attempted_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await db.execute(`SELECT COUNT(*) AS total FROM login_attempts l LEFT JOIN users u ON u.id = l.user_id ${whereSql}`, values);

  return { attempts: rows, total: countRows[0]?.total || 0, page, limit };
}

export async function setUserStatus(userId, status) {
  const [result] = await db.execute('UPDATE users SET status = ?, is_active = ? WHERE id = ?', [
    status,
    status === 'active' ? 1 : 0,
    userId,
  ]);
  return result.affectedRows;
}

export async function listActiveSessions() {
  const [rows] = await db.execute(
    `SELECT s.id, s.user_id AS userId, u.full_name AS userName, u.role, s.login_time AS loginTime,
      s.ip_address AS ipAddress, s.user_agent AS userAgent
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.logout_time IS NULL
     ORDER BY s.login_time DESC
     LIMIT 50`,
  );
  return rows;
}

export async function createBackupRecord(payload) {
  const [result] = await db.execute(
    `INSERT INTO backup_history
      (uuid, backup_type, backup_scope, backup_size, status, duration_ms, created_by, metadata, file_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.backupType,
      payload.backupScope,
      payload.backupSize || 0,
      payload.status || 'completed',
      payload.durationMs || 0,
      payload.createdBy,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
      payload.filePath || null,
    ],
  );
  return result.insertId;
}

export async function listBackups(filters = {}) {
  const { limit, offset, page } = limitOffset(filters);
  const [rows] = await db.execute(
    `SELECT b.id, b.uuid, b.backup_type AS backupType, b.backup_scope AS backupScope,
      b.backup_size AS backupSize, b.status, b.duration_ms AS durationMs, b.created_by AS createdBy,
      u.full_name AS createdByName, b.metadata, b.file_path AS filePath, b.created_at AS createdAt
     FROM backup_history b
     LEFT JOIN users u ON u.id = b.created_by
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  const [countRows] = await db.execute('SELECT COUNT(*) AS total FROM backup_history');
  return { backups: rows, total: countRows[0]?.total || 0, page, limit };
}

export async function createRestoreRecord(payload) {
  const [result] = await db.execute(
    `INSERT INTO restore_history
      (uuid, backup_id, restore_scope, status, duration_ms, restored_by, validation_status, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.backupId || null,
      payload.restoreScope,
      payload.status || 'completed',
      payload.durationMs || 0,
      payload.restoredBy,
      payload.validationStatus || 'passed',
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
  return result.insertId;
}

export async function listRestoreHistory(filters = {}) {
  const { limit, offset, page } = limitOffset(filters);
  const where = [];
  const values = [];

  if (filters.status) {
    where.push('r.status = ?');
    values.push(filters.status);
  }
  if (filters.userId) {
    where.push('r.restored_by = ?');
    values.push(Number(filters.userId));
  }
  if (filters.backupId) {
    where.push('r.backup_id = ?');
    values.push(Number(filters.backupId));
  }
  if (filters.dateFrom) {
    where.push('DATE(r.created_at) >= ?');
    values.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    where.push('DATE(r.created_at) <= ?');
    values.push(filters.dateTo);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT r.id, r.uuid, r.backup_id AS backupId, b.uuid AS backupUuid,
      r.restore_scope AS restoreScope, r.status, r.duration_ms AS durationMs,
      r.restored_by AS restoredBy, u.full_name AS restoredByName,
      r.validation_status AS validationStatus, r.metadata, r.created_at AS createdAt
     FROM restore_history r
     LEFT JOIN backup_history b ON b.id = r.backup_id
     LEFT JOIN users u ON u.id = r.restored_by
     ${whereSql}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM restore_history r ${whereSql}`,
    values,
  );

  return { restores: rows, total: countRows[0]?.total || 0, page, limit };
}

export async function createSystemHealthSnapshot(payload) {
  await db.execute(
    `INSERT INTO system_health
      (status, cpu_usage, memory_usage, storage_usage, database_size, api_requests,
       active_users, ai_requests, error_count, backup_status, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.status,
      payload.cpuUsage,
      payload.memoryUsage,
      payload.storageUsage,
      payload.databaseSize,
      payload.apiRequests,
      payload.activeUsers,
      payload.aiRequests,
      payload.errorCount,
      payload.backupStatus,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
}

export async function getSecurityDashboard() {
  const [auditSummary] = await db.execute(
    `SELECT module, COUNT(*) AS total FROM audit_logs
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY module ORDER BY total DESC LIMIT 8`,
  );
  const [failedLogins] = await db.execute(
    `SELECT COUNT(*) AS total FROM login_attempts
     WHERE status = 'failed' AND attempted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
  );
  const [openAlerts] = await db.execute("SELECT COUNT(*) AS total FROM security_alerts WHERE status = 'open'");
  const [activeUsers] = await db.execute('SELECT COUNT(DISTINCT user_id) AS total FROM user_sessions WHERE logout_time IS NULL');
  const [backup] = await db.execute('SELECT status, created_at AS createdAt FROM backup_history ORDER BY created_at DESC LIMIT 1');
  const [storage] = await db.execute(
    "SELECT COUNT(*) AS totalFiles, COALESCE(SUM(file_size), 0) AS storageUsed FROM files WHERE status <> 'deleted'",
  );

  return {
    auditSummary,
    failedLogins24h: failedLogins[0]?.total || 0,
    openAlerts: openAlerts[0]?.total || 0,
    activeUsers: activeUsers[0]?.total || 0,
    latestBackup: backup[0] || null,
    storage: storage[0] || { totalFiles: 0, storageUsed: 0 },
  };
}

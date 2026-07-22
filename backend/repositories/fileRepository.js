import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { generateId } from '../utils/idGenerator.js';

const fileSelect = `SELECT f.id, f.uuid, f.file_name AS fileName, f.original_file_name AS originalFileName,
  f.file_type AS fileType, f.mime_type AS mimeType, f.file_size AS fileSize, f.file_path AS filePath,
  f.storage_provider AS storageProvider, f.uploaded_by AS uploadedBy, f.uploaded_role AS uploadedRole,
  f.curriculum, f.subject, f.week_no AS weekNo, f.topic, f.logical_folder AS logicalFolder,
  f.version, f.current_version_id AS currentVersionId, f.description, f.visibility, f.audience, f.status,
  f.tags, f.download_count AS downloadCount, f.view_count AS viewCount, f.created_at AS createdAt,
  f.updated_at AS updatedAt, u.full_name AS owner
 FROM files f
 LEFT JOIN users u ON u.id = f.uploaded_by`;

let fileAudienceSchemaReady = false;

export async function ensureFileAudienceSchema() {
  if (fileAudienceSchemaReady) return;

  const [columns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'files'
      AND COLUMN_NAME = 'audience'`,
  );

  if (!columns.length) {
    await db.query(
      "ALTER TABLE files ADD COLUMN audience ENUM('all', 'super-admin', 'admin', 'teacher', 'student') NOT NULL DEFAULT 'all' AFTER visibility",
    );
    await db.query('CREATE INDEX idx_files_audience_status ON files (audience, status)');
  }

  fileAudienceSchemaReady = true;
}

function getUserId(user) {
  return user?.id || user?.userId;
}

function applyRoleScope(user, where, values) {
  if (user.role === ROLES.SUPER_ADMIN) return;

  if (user.role === ROLES.ADMIN) {
    where.push("(f.uploaded_by = ? OR (f.uploaded_role <> 'student' AND f.audience IN (?, ?)))");
    values.push(getUserId(user), 'all', ROLES.ADMIN);
    return;
  }

  if (user.role === ROLES.TEACHER) {
    where.push('(f.uploaded_by = ? OR (f.visibility = ? AND f.status = ? AND f.uploaded_role <> ? AND f.audience IN (?, ?)))');
    values.push(getUserId(user), 'public', 'active', ROLES.STUDENT, 'all', ROLES.TEACHER);
    return;
  }

  if (user.role === ROLES.STUDENT) {
    where.push('((f.visibility = ? AND f.status = ? AND f.uploaded_role <> ? AND f.audience IN (?, ?)) OR f.uploaded_by = ?)');
    values.push('public', 'active', ROLES.STUDENT, 'all', ROLES.STUDENT, getUserId(user));
  }
}

function applyFilters(filters, where, values) {
  if (filters.search) {
    where.push(
      '(f.original_file_name LIKE ? OR f.topic LIKE ? OR f.subject LIKE ? OR f.curriculum LIKE ? OR f.tags LIKE ?)',
    );
    const term = `%${filters.search}%`;
    values.push(term, term, term, term, term);
  }

  for (const [key, column] of [
    ['fileType', 'f.file_type'],
    ['status', 'f.status'],
    ['visibility', 'f.visibility'],
    ['audience', 'f.audience'],
    ['teacher', 'u.full_name'],
    ['subject', 'f.subject'],
    ['curriculum', 'f.curriculum'],
    ['topic', 'f.topic'],
  ]) {
    if (filters[key]) {
      where.push(`${column} LIKE ?`);
      values.push(`%${filters[key]}%`);
    }
  }

  if (filters.weekNo) {
    where.push('f.week_no = ?');
    values.push(Number(filters.weekNo));
  }

  if (filters.minSize) {
    where.push('f.file_size >= ?');
    values.push(Number(filters.minSize));
  }

  if (filters.maxSize) {
    where.push('f.file_size <= ?');
    values.push(Number(filters.maxSize));
  }

  if (filters.dateFrom) {
    where.push('DATE(f.created_at) >= ?');
    values.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    where.push('DATE(f.created_at) <= ?');
    values.push(filters.dateTo);
  }
}

function sortClause(sort = 'newest') {
  const options = {
    newest: 'f.created_at DESC',
    oldest: 'f.created_at ASC',
    az: 'f.original_file_name ASC',
    za: 'f.original_file_name DESC',
    largest: 'f.file_size DESC',
    mostDownloaded: 'f.download_count DESC',
    mostViewed: 'f.view_count DESC',
  };

  return options[sort] || options.newest;
}

export async function listFiles(user, filters = {}) {
  await ensureFileAudienceSchema();
  const limit = Math.min(Number(filters.limit || 20), 100);
  const page = Math.max(Number(filters.page || 1), 1);
  const offset = (page - 1) * limit;
  const where = [];
  const values = [];

  applyRoleScope(user, where, values);
  applyFilters(filters, where, values);

  if (!filters.status) {
    where.push("f.status <> 'deleted'");
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(
    `${fileSelect}
     ${whereSql}
     ORDER BY ${sortClause(filters.sort)}
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM files f LEFT JOIN users u ON u.id = f.uploaded_by ${whereSql}`,
    values,
  );

  return {
    files: rows,
    total: countRows[0]?.total || 0,
    page,
    limit,
  };
}

export async function findFileById(id) {
  await ensureFileAudienceSchema();
  const [rows] = await db.execute(`${fileSelect} WHERE f.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export function canAccessFile(user, file, action = 'read') {
  if (!file) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.ADMIN) {
    if (file.uploadedBy === getUserId(user)) return true;
    return file.uploadedRole !== ROLES.STUDENT && ['all', ROLES.ADMIN].includes(file.audience);
  }
  if (user.role === ROLES.TEACHER) {
    return file.uploadedBy === getUserId(user) ||
      (action === 'read' && file.visibility === 'public' && file.status === 'active' && ['all', ROLES.TEACHER].includes(file.audience));
  }
  if (user.role === ROLES.STUDENT) {
    return file.uploadedBy === getUserId(user) ||
      (action === 'read' && file.visibility === 'public' && file.status === 'active' && ['all', ROLES.STUDENT].includes(file.audience));
  }
  return false;
}

export async function findDuplicate({ originalFileName, fileSize, uploadedBy, curriculum, subject, weekNo, topic }) {
  const [rows] = await db.execute(
    `SELECT id, original_file_name AS originalFileName, version
     FROM files
     WHERE original_file_name = ? AND file_size = ? AND uploaded_by = ?
       AND COALESCE(curriculum, '') = COALESCE(?, '')
       AND COALESCE(subject, '') = COALESCE(?, '')
       AND COALESCE(week_no, 0) = COALESCE(?, 0)
       AND COALESCE(topic, '') = COALESCE(?, '')
       AND status <> 'deleted'
     LIMIT 1`,
    [originalFileName, fileSize, uploadedBy, curriculum || null, subject || null, weekNo || null, topic || null],
  );

  return rows[0] || null;
}

export async function createFileRecord(payload) {
  await ensureFileAudienceSchema();
  const [result] = await db.execute(
    `INSERT INTO files
      (uuid, file_name, original_file_name, file_type, mime_type, file_size, file_path,
       storage_provider, uploaded_by, uploaded_role, curriculum, subject, week_no, topic,
       logical_folder, version, description, visibility, audience, status, tags, checksum)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.fileName,
      payload.originalFileName,
      payload.fileType,
      payload.mimeType,
      payload.fileSize,
      payload.filePath,
      payload.storageProvider,
      payload.uploadedBy,
      payload.uploadedRole,
      payload.curriculum || null,
      payload.subject || null,
      payload.weekNo || null,
      payload.topic || null,
      payload.logicalFolder || null,
      payload.version || 1,
      payload.description || null,
      payload.visibility || 'private',
      payload.audience || 'all',
      payload.status || 'active',
      payload.tags || null,
      payload.checksum || null,
    ],
  );

  return result.insertId;
}

export async function createFileVersion(fileId, payload) {
  const [currentRows] = await db.execute('SELECT COALESCE(MAX(version), 0) + 1 AS nextVersion FROM file_versions WHERE file_id = ?', [
    fileId,
  ]);
  const version = currentRows[0]?.nextVersion || 1;
  const [result] = await db.execute(
    `INSERT INTO file_versions
      (file_id, version, file_name, original_file_name, file_type, mime_type, file_size,
       file_path, storage_provider, uploaded_by, description, version_note, checksum, is_current)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      fileId,
      version,
      payload.fileName,
      payload.originalFileName,
      payload.fileType,
      payload.mimeType,
      payload.fileSize,
      payload.filePath,
      payload.storageProvider,
      payload.uploadedBy,
      payload.description || null,
      payload.versionNote || null,
      payload.checksum || null,
    ],
  );

  await db.execute('UPDATE file_versions SET is_current = 0 WHERE file_id = ? AND id <> ?', [fileId, result.insertId]);
  await db.execute(
    `UPDATE files
     SET file_name = ?, original_file_name = ?, file_type = ?, mime_type = ?, file_size = ?,
       file_path = ?, storage_provider = ?, version = ?, current_version_id = ?, description = COALESCE(?, description),
       updated_at = NOW()
     WHERE id = ?`,
    [
      payload.fileName,
      payload.originalFileName,
      payload.fileType,
      payload.mimeType,
      payload.fileSize,
      payload.filePath,
      payload.storageProvider,
      version,
      result.insertId,
      payload.description || null,
      fileId,
    ],
  );

  return result.insertId;
}

export async function updateFileRecord(id, payload) {
  await ensureFileAudienceSchema();
  const allowed = ['curriculum', 'subject', 'weekNo', 'topic', 'description', 'visibility', 'audience', 'status', 'tags'];
  const columns = {
    weekNo: 'week_no',
  };
  const assignments = [];
  const values = [];

  for (const key of allowed) {
    if (payload[key] !== undefined) {
      assignments.push(`${columns[key] || key} = ?`);
      values.push(payload[key] || null);
    }
  }

  if (!assignments.length) return;

  await db.execute(`UPDATE files SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = ?`, [...values, id]);
}

export async function deleteFileRecord(id) {
  const [result] = await db.execute("UPDATE files SET status = 'deleted', updated_at = NOW() WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function listFileVersions(fileId) {
  const [rows] = await db.execute(
    `SELECT id, file_id AS fileId, version, file_name AS fileName, original_file_name AS originalFileName,
      file_type AS fileType, mime_type AS mimeType, file_size AS fileSize, storage_provider AS storageProvider,
      uploaded_by AS uploadedBy, description, version_note AS versionNote, is_current AS isCurrent, created_at AS createdAt
     FROM file_versions
     WHERE file_id = ?
     ORDER BY version DESC`,
    [fileId],
  );

  return rows;
}

export async function findFileIdByVersion(versionId) {
  const [rows] = await db.execute('SELECT file_id AS fileId FROM file_versions WHERE id = ? LIMIT 1', [versionId]);
  return rows[0]?.fileId || null;
}

export async function restoreVersion(versionId) {
  const [rows] = await db.execute('SELECT * FROM file_versions WHERE id = ? LIMIT 1', [versionId]);
  const version = rows[0];
  if (!version) return null;

  await db.execute('UPDATE file_versions SET is_current = 0 WHERE file_id = ?', [version.file_id]);
  await db.execute('UPDATE file_versions SET is_current = 1 WHERE id = ?', [versionId]);
  await db.execute(
    `UPDATE files
     SET file_name = ?, original_file_name = ?, file_type = ?, mime_type = ?, file_size = ?,
       file_path = ?, storage_provider = ?, version = ?, current_version_id = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      version.file_name,
      version.original_file_name,
      version.file_type,
      version.mime_type,
      version.file_size,
      version.file_path,
      version.storage_provider,
      version.version,
      versionId,
      version.file_id,
    ],
  );

  return version.file_id;
}

export async function recordDownload({ fileId, userId, ipAddress, deviceInfo }) {
  await db.execute(
    'INSERT INTO file_downloads (file_id, downloaded_by, ip_address, device_information) VALUES (?, ?, ?, ?)',
    [fileId, userId, ipAddress || null, deviceInfo ? JSON.stringify(deviceInfo) : null],
  );
  await db.execute('UPDATE files SET download_count = download_count + 1 WHERE id = ?', [fileId]);
}

export async function recordPreview({ fileId, userId, ipAddress, deviceInfo }) {
  await db.execute(
    'INSERT INTO file_previews (file_id, viewed_by, ip_address, device_information) VALUES (?, ?, ?, ?)',
    [fileId, userId, ipAddress || null, deviceInfo ? JSON.stringify(deviceInfo) : null],
  );
  await db.execute('UPDATE files SET view_count = view_count + 1 WHERE id = ?', [fileId]);
}

export async function getStorageStatistics(user, providerName = 'local') {
  await ensureFileAudienceSchema();
  const where = [];
  const values = [];
  applyRoleScope(user, where, values);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')} AND f.status <> 'deleted'` : "WHERE f.status <> 'deleted'";
  const [summary] = await db.execute(
    `SELECT COUNT(*) AS totalFiles, COALESCE(SUM(file_size), 0) AS totalStorageUsed,
      COALESCE(AVG(file_size), 0) AS averageFileSize
     FROM files f
     LEFT JOIN users u ON u.id = f.uploaded_by
     ${whereSql}`,
    values,
  );
  const [byType] = await db.execute(
    `SELECT file_type AS fileType, COUNT(*) AS totalFiles, COALESCE(SUM(file_size), 0) AS storageUsed
     FROM files f
     LEFT JOIN users u ON u.id = f.uploaded_by
     ${whereSql}
     GROUP BY file_type
     ORDER BY storageUsed DESC`,
    values,
  );
  const [recentUploads] = await db.execute(`${fileSelect} ${whereSql} ORDER BY f.created_at DESC LIMIT 8`, values);
  const [largestFiles] = await db.execute(`${fileSelect} ${whereSql} ORDER BY f.file_size DESC LIMIT 8`, values);
  const [mostDownloaded] = await db.execute(`${fileSelect} ${whereSql} ORDER BY f.download_count DESC LIMIT 8`, values);
  const [mostViewed] = await db.execute(`${fileSelect} ${whereSql} ORDER BY f.view_count DESC LIMIT 8`, values);

  await db.execute(
    `INSERT INTO storage_statistics
      (total_files, total_storage_used, storage_by_file_type, provider, role_scope, generated_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      summary[0]?.totalFiles || 0,
      summary[0]?.totalStorageUsed || 0,
      JSON.stringify(byType),
      providerName,
      user.role,
      getUserId(user),
    ],
  );

  return {
    summary: summary[0],
    byType,
    recentUploads,
    largestFiles,
    mostDownloaded,
    mostViewed,
  };
}

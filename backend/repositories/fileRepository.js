import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { generateId } from '../utils/idGenerator.js';
import { ensureUserAssignmentSchema, findTeacherDepartmentsByUserId } from './userManagementRepository.js';

const fileSelect = `SELECT f.id, f.uuid, f.file_name AS fileName, f.original_file_name AS originalFileName,
  f.file_type AS fileType, f.mime_type AS mimeType, f.file_size AS fileSize, f.file_path AS filePath,
  f.storage_provider AS storageProvider, f.uploaded_by AS uploadedBy, f.uploaded_role AS uploadedRole,
  f.curriculum, f.subject, f.week_no AS weekNo, f.topic, f.logical_folder AS logicalFolder,
  f.version, f.current_version_id AS currentVersionId, f.description, f.visibility, f.audience, f.status,
  f.tags, f.download_count AS downloadCount, f.view_count AS viewCount, f.created_at AS createdAt,
  f.updated_at AS updatedAt, u.full_name AS owner,
  (SELECT GROUP_CONCAT(fd.department_id ORDER BY fd.department_id)
   FROM file_departments fd
   WHERE fd.file_id = f.id) AS targetDepartmentIdsCsv,
  (SELECT GROUP_CONCAT(d.name ORDER BY d.name SEPARATOR ', ')
   FROM file_departments fd
   INNER JOIN departments d ON d.id = fd.department_id
   WHERE fd.file_id = f.id) AS targetDepartmentNames
 FROM files f
 LEFT JOIN users u ON u.id = f.uploaded_by`;

let fileAudienceSchemaReady = false;
let fileDepartmentSchemaReady = false;

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

export async function ensureFileDepartmentSchema() {
  if (fileDepartmentSchemaReady) return;

  await db.query(
    `CREATE TABLE IF NOT EXISTS file_departments (
      file_id BIGINT UNSIGNED NOT NULL,
      department_id BIGINT UNSIGNED NOT NULL,
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (file_id, department_id),
      CONSTRAINT fk_file_departments_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
      CONSTRAINT fk_file_departments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      INDEX idx_file_departments_department (department_id)
    )`,
  );

  fileDepartmentSchemaReady = true;
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
    where.push(`(
      f.uploaded_by = ?
      OR (
        f.visibility = ?
        AND f.status = ?
        AND f.uploaded_role <> ?
        AND f.audience IN (?, ?)
        AND (
          f.audience <> ?
          OR NOT EXISTS (
            SELECT 1
            FROM file_departments scoped_fd_any
            WHERE scoped_fd_any.file_id = f.id
          )
          OR EXISTS (
            SELECT 1
            FROM teacher_departments scoped_td
            INNER JOIN teachers scoped_teacher ON scoped_teacher.id = scoped_td.teacher_id
            INNER JOIN file_departments scoped_fd
              ON scoped_fd.file_id = f.id
              AND scoped_fd.department_id = scoped_td.department_id
            WHERE scoped_teacher.user_id = ?
          )
        )
      )
    )`);
    values.push(getUserId(user), 'public', 'active', ROLES.STUDENT, 'all', ROLES.TEACHER, ROLES.TEACHER, getUserId(user));
    return;
  }

  if (user.role === ROLES.STUDENT) {
    where.push(`(
      (
        f.visibility = ?
        AND f.status = ?
        AND f.uploaded_role <> ?
        AND f.audience IN (?, ?)
        AND (
          f.uploaded_role <> ?
          OR EXISTS (
            SELECT 1
            FROM students scoped_student
            INNER JOIN student_departments scoped_sd
              ON scoped_sd.student_id = scoped_student.id
            INNER JOIN teacher_departments scoped_td
              ON scoped_td.department_id = scoped_sd.department_id
            INNER JOIN teachers scoped_teacher
              ON scoped_teacher.id = scoped_td.teacher_id
              AND scoped_teacher.user_id = f.uploaded_by
            WHERE scoped_student.user_id = ?
              AND (
                NOT EXISTS (
                  SELECT 1
                  FROM file_departments scoped_fd_any
                  WHERE scoped_fd_any.file_id = f.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM file_departments scoped_fd
                  WHERE scoped_fd.file_id = f.id
                    AND scoped_fd.department_id = scoped_sd.department_id
                )
              )
          )
        )
      )
      OR f.uploaded_by = ?
    )`);
    values.push('public', 'active', ROLES.STUDENT, 'all', ROLES.STUDENT, ROLES.TEACHER, getUserId(user), getUserId(user));
  }
}

function applyFilters(filters, where, values) {
  if (filters.search) {
    where.push(
      `(f.original_file_name LIKE ?
        OR f.file_type LIKE ?
        OR f.topic LIKE ?
        OR f.subject LIKE ?
        OR f.curriculum LIKE ?
        OR f.description LIKE ?
        OR f.logical_folder LIKE ?
        OR f.tags LIKE ?
        OR u.full_name LIKE ?)`,
    );
    const term = `%${filters.search}%`;
    values.push(term, term, term, term, term, term, term, term, term);
  }

  if (filters.fileType) {
    const fileTypes = String(filters.fileType).split(',').map((item) => item.trim()).filter(Boolean);
    if (fileTypes.length === 1) {
      where.push('f.file_type = ?');
      values.push(fileTypes[0]);
    } else if (fileTypes.length > 1) {
      where.push(`f.file_type IN (${fileTypes.map(() => '?').join(', ')})`);
      values.push(...fileTypes);
    }
  }

  for (const [key, column] of [
    ['status', 'f.status'],
    ['visibility', 'f.visibility'],
    ['audience', 'f.audience'],
  ]) {
    if (filters[key]) {
      where.push(`${column} = ?`);
      values.push(filters[key]);
    }
  }

  for (const [key, column] of [
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
    az: 'LOWER(f.original_file_name) ASC',
    za: 'LOWER(f.original_file_name) DESC',
    largest: 'f.file_size DESC',
    mostDownloaded: 'f.download_count DESC',
    mostViewed: 'f.view_count DESC',
  };

  return options[sort] || options.newest;
}

export async function listFiles(user, filters = {}) {
  await ensureFileAudienceSchema();
  await ensureFileDepartmentSchema();
  if (user.role === ROLES.STUDENT) {
    await ensureUserAssignmentSchema();
  }
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
    files: rows.map((row) => ({
      ...row,
      targetDepartmentIds: row.targetDepartmentIdsCsv
        ? String(row.targetDepartmentIdsCsv).split(',').map(Number).filter(Boolean)
        : [],
      targetDepartments: row.targetDepartmentNames || '',
    })),
    total: countRows[0]?.total || 0,
    page,
    limit,
  };
}

export async function findFileById(id) {
  await ensureFileAudienceSchema();
  await ensureFileDepartmentSchema();
  const [rows] = await db.execute(`${fileSelect} WHERE f.id = ? LIMIT 1`, [id]);
  if (!rows[0]) return null;

  const [departments] = await db.execute(
    `SELECT d.id, d.name
     FROM file_departments fd
     INNER JOIN departments d ON d.id = fd.department_id
     WHERE fd.file_id = ?
     ORDER BY d.name`,
    [id],
  );

  return {
    ...rows[0],
    targetDepartmentIds: departments.map((department) => department.id),
    targetDepartments: departments,
  };
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

export async function canAccessFileRecord(user, file, action = 'read') {
  if (!canAccessFile(user, file, action)) return false;

  if (
    action === 'read' &&
    user.role === ROLES.TEACHER &&
    file.audience === ROLES.TEACHER &&
    file.uploadedBy !== getUserId(user)
  ) {
    await ensureUserAssignmentSchema();
    const [rows] = await db.execute(
      `SELECT 1
       FROM teachers scoped_teacher
       INNER JOIN teacher_departments scoped_td
        ON scoped_td.teacher_id = scoped_teacher.id
       WHERE scoped_teacher.user_id = ?
        AND (
          NOT EXISTS (
            SELECT 1
            FROM file_departments scoped_fd_any
            WHERE scoped_fd_any.file_id = ?
          )
          OR EXISTS (
            SELECT 1
            FROM file_departments scoped_fd
            WHERE scoped_fd.file_id = ?
              AND scoped_fd.department_id = scoped_td.department_id
          )
        )
       LIMIT 1`,
      [getUserId(user), file.id, file.id],
    );
    return rows.length > 0;
  }

  if (
    action === 'read' &&
    user.role === ROLES.STUDENT &&
    file.uploadedRole === ROLES.TEACHER &&
    file.uploadedBy !== getUserId(user)
  ) {
    await ensureUserAssignmentSchema();
    const [rows] = await db.execute(
      `SELECT 1
       FROM students scoped_student
       INNER JOIN student_departments scoped_sd
        ON scoped_sd.student_id = scoped_student.id
       INNER JOIN teacher_departments scoped_td
        ON scoped_td.department_id = scoped_sd.department_id
       INNER JOIN teachers scoped_teacher
        ON scoped_teacher.id = scoped_td.teacher_id
       WHERE scoped_student.user_id = ?
        AND scoped_teacher.user_id = ?
        AND (
          NOT EXISTS (
            SELECT 1
            FROM file_departments scoped_fd_any
            WHERE scoped_fd_any.file_id = ?
          )
          OR EXISTS (
            SELECT 1
            FROM file_departments scoped_fd
            WHERE scoped_fd.file_id = ?
              AND scoped_fd.department_id = scoped_sd.department_id
          )
        )
       LIMIT 1`,
      [getUserId(user), file.uploadedBy, file.id, file.id],
    );
    return rows.length > 0;
  }

  return true;
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
  await ensureFileDepartmentSchema();
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

export async function syncFileDepartments(fileId, departmentIds = []) {
  await ensureFileDepartmentSchema();
  const uniqueIds = [...new Set((departmentIds || []).map(Number).filter(Boolean))];
  await db.execute('DELETE FROM file_departments WHERE file_id = ?', [fileId]);

  if (!uniqueIds.length) return;

  await db.query(
    `INSERT INTO file_departments (file_id, department_id)
     VALUES ${uniqueIds.map(() => '(?, ?)').join(', ')}`,
    uniqueIds.flatMap((departmentId) => [fileId, departmentId]),
  );
}

export async function findTeacherAssignableFileDepartments(userId) {
  return findTeacherDepartmentsByUserId(userId);
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
  await ensureFileDepartmentSchema();
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
  await ensureFileDepartmentSchema();
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

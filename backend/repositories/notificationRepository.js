import { db } from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';
import { ensureUserAssignmentSchema } from './userManagementRepository.js';

const notificationSelect = `SELECT id, uuid, user_id AS userId, role, title, message,
  notification_type AS notificationType, priority, source_module AS sourceModule,
  action_url AS actionUrl, status, is_read AS isRead, read_at AS readAt,
  metadata, created_at AS createdAt, updated_at AS updatedAt
 FROM notifications`;

const preferenceByType = {
  quiz: 'quiz_notifications',
  announcement: 'announcement_notifications',
  material: 'material_upload_notifications',
  reminder: 'reminder_notifications',
  security: 'security_notifications',
};

let announcementTargetSchemaReady = false;
let announcementScopeSchemaReady = false;
let notificationHistorySchemaReady = false;

async function ensureNotificationHistorySchema() {
  if (notificationHistorySchemaReady) return;

  const [columns] = await db.query(
    `SELECT COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_history'
      AND COLUMN_NAME = 'event_type'
     LIMIT 1`,
  );

  if (columns[0]?.COLUMN_TYPE && !String(columns[0].COLUMN_TYPE).includes("'unread'")) {
    await db.query(
      `ALTER TABLE notification_history
       MODIFY event_type ENUM('created', 'read', 'unread', 'deleted', 'archived') NOT NULL`,
    );
  }

  notificationHistorySchemaReady = true;
}

async function ensureAnnouncementTargetSchema() {
  if (announcementTargetSchemaReady) return;

  const [columns] = await db.query(
    `SELECT COLUMN_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'announcement_targets'
      AND COLUMN_NAME = 'target_type'
     LIMIT 1`,
  );

  if (columns[0]?.COLUMN_TYPE && !String(columns[0].COLUMN_TYPE).includes("'department'")) {
    await db.query(
      `ALTER TABLE announcement_targets
       MODIFY target_type ENUM('all_users', 'role', 'curriculum', 'batch', 'teacher', 'student', 'department')
       NOT NULL DEFAULT 'all_users'`,
    );
  }

  announcementTargetSchemaReady = true;
}

async function ensureAnnouncementScopeSchema() {
  if (announcementScopeSchemaReady) return;

  const requiredColumns = [
    ['department_id', 'BIGINT UNSIGNED NULL AFTER audience_role', 'idx_announcements_department_id'],
    ['curriculum_id', 'BIGINT UNSIGNED NULL AFTER department_id', 'idx_announcements_curriculum_id'],
    ['course_id', 'BIGINT UNSIGNED NULL AFTER curriculum_id', 'idx_announcements_course_id'],
    ['week_no', 'INT NULL AFTER course_id', 'idx_announcements_week_no'],
  ];

  for (const [columnName, columnDefinition, indexName] of requiredColumns) {
    const [columns] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'announcements'
        AND COLUMN_NAME = ?
       LIMIT 1`,
      [columnName],
    );

    if (!columns.length) {
      await db.query(`ALTER TABLE announcements ADD COLUMN ${columnName} ${columnDefinition}`);
    }

    const [indexes] = await db.query(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'announcements'
        AND INDEX_NAME = ?
       LIMIT 1`,
      [indexName],
    );

    if (!indexes.length) {
      await db.query(`CREATE INDEX ${indexName} ON announcements (${columnName})`);
    }
  }

  announcementScopeSchemaReady = true;
}

function toDatabaseBoolean(value) {
  if (typeof value === 'string') {
    return ['1', 'true', 'on', 'yes'].includes(value.trim().toLowerCase()) ? 1 : 0;
  }

  return value ? 1 : 0;
}

function toMysqlDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const pad = (part) => String(part).padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
}

async function isNotificationEnabled(userId, notificationType) {
  const preferenceColumn = preferenceByType[notificationType];

  if (!preferenceColumn) {
    return true;
  }

  await db.execute('INSERT IGNORE INTO notification_preferences (user_id) VALUES (?)', [userId]);
  const [rows] = await db.query(
    `SELECT ${preferenceColumn} AS enabled FROM notification_preferences WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  return Boolean(rows[0]?.enabled);
}

export async function listNotifications({
  userId,
  search,
  type,
  readStatus,
  priority,
  status = 'active',
  sort = 'unreadFirst',
  limit = 30,
  offset = 0,
}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const where = ['user_id = ?', 'status = ?'];
  const values = [userId, status];

  if (type) {
    where.push('notification_type = ?');
    values.push(type);
  }

  if (priority) {
    where.push('priority = ?');
    values.push(priority);
  }

  if (readStatus === 'read') {
    where.push('is_read = 1');
  }

  if (readStatus === 'unread') {
    where.push('is_read = 0');
  }

  if (search) {
    where.push('(title LIKE ? OR message LIKE ? OR source_module LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const orderBy = {
    newest: 'created_at DESC',
    oldest: 'created_at ASC',
    unreadFirst: 'is_read ASC, created_at DESC',
    priority: `FIELD(priority, 'urgent', 'important', 'normal'), created_at DESC`,
  }[sort] || 'is_read ASC, created_at DESC';

  const whereSql = where.join(' AND ');
  const [rows] = await db.query(
    `${notificationSelect}
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...values, safeLimit, safeOffset],
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM notifications WHERE ${whereSql}`,
    values,
  );

  return {
    notifications: rows,
    total: countRows[0]?.total || 0,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function countUnreadNotifications(userId) {
  const [rows] = await db.execute(
    "SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0 AND status = 'active'",
    [userId],
  );

  return rows[0]?.unread || 0;
}

export async function countNotificationSummary(userId) {
  const [rows] = await db.execute(
    `SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unread,
      SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) AS readCount,
      SUM(CASE WHEN DATE(created_at) = CURRENT_DATE() THEN 1 ELSE 0 END) AS todayCount,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS weeklyCount,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS monthlyCount
     FROM notifications
     WHERE user_id = ? AND status = 'active'`,
    [userId],
  );

  return {
    total: Number(rows[0]?.total || 0),
    unread: Number(rows[0]?.unread || 0),
    readCount: Number(rows[0]?.readCount || 0),
    todayCount: Number(rows[0]?.todayCount || 0),
    weeklyCount: Number(rows[0]?.weeklyCount || 0),
    monthlyCount: Number(rows[0]?.monthlyCount || 0),
  };
}

export async function createNotification(payload) {
  const notificationType = payload.notificationType || 'system';

  if (!(await isNotificationEnabled(payload.userId, notificationType))) {
    return null;
  }

  const [result] = await db.execute(
    `INSERT INTO notifications
      (uuid, user_id, role, title, message, notification_type, priority, source_module,
       action_url, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.userId,
      payload.role,
      payload.title,
      payload.message,
      notificationType,
      payload.priority || 'normal',
      payload.sourceModule || null,
      payload.actionUrl || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );

  await recordNotificationHistory({
    notificationId: result.insertId,
    userId: payload.userId,
    eventType: 'created',
  });

  return result.insertId;
}

export async function markNotificationsRead({ userId, ids }) {
  const values = [userId];
  const where = ['user_id = ?', 'status = \'active\''];

  if (ids?.length) {
    where.push(`id IN (${ids.map(() => '?').join(', ')})`);
    values.push(...ids);
  }

  const [targetRows] = await db.execute(
    `SELECT id FROM notifications WHERE ${where.join(' AND ')} AND is_read = 0`,
    values,
  );
  const [result] = await db.execute(
    `UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, NOW())
     WHERE ${where.join(' AND ')}`,
    values,
  );

  await Promise.all(
    targetRows.map((row) =>
      recordNotificationHistory({ notificationId: row.id, userId, eventType: 'read' }),
    ),
  );

  return result.affectedRows;
}

export async function markNotificationsUnread({ userId, ids }) {
  const safeIds = (ids || []).map(Number).filter(Boolean);
  if (!safeIds.length) {
    return 0;
  }

  const placeholders = safeIds.map(() => '?').join(', ');
  const values = [userId, ...safeIds];
  const [targetRows] = await db.execute(
    `SELECT id FROM notifications
     WHERE user_id = ? AND status = 'active' AND id IN (${placeholders}) AND is_read = 1`,
    values,
  );
  const [result] = await db.execute(
    `UPDATE notifications SET is_read = 0, read_at = NULL, updated_at = NOW()
     WHERE user_id = ? AND status = 'active' AND id IN (${placeholders})`,
    values,
  );

  await Promise.all(
    targetRows.map((row) =>
      recordNotificationHistory({ notificationId: row.id, userId, eventType: 'unread' }),
    ),
  );

  return result.affectedRows;
}

export async function deleteNotification({ userId, id }) {
  const [result] = await db.execute(
    "UPDATE notifications SET status = 'deleted', updated_at = NOW() WHERE id = ? AND user_id = ? AND status = 'active'",
    [id, userId],
  );

  if (result.affectedRows) {
    await recordNotificationHistory({ notificationId: id, userId, eventType: 'deleted' });
  }

  return result.affectedRows > 0;
}

export async function getNotificationPreferences(userId) {
  await db.execute('INSERT IGNORE INTO notification_preferences (user_id) VALUES (?)', [userId]);
  const [rows] = await db.execute(
    `SELECT user_id AS userId, quiz_notifications AS quizNotifications,
      announcement_notifications AS announcementNotifications,
      material_upload_notifications AS materialUploadNotifications,
      reminder_notifications AS reminderNotifications,
      security_notifications AS securityNotifications,
      email_notifications AS emailNotifications,
      push_notifications AS pushNotifications,
      sms_notifications AS smsNotifications
     FROM notification_preferences WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
}

export async function updateNotificationPreferences(userId, payload) {
  const allowed = {
    quizNotifications: 'quiz_notifications',
    announcementNotifications: 'announcement_notifications',
    materialUploadNotifications: 'material_upload_notifications',
    reminderNotifications: 'reminder_notifications',
    securityNotifications: 'security_notifications',
    emailNotifications: 'email_notifications',
    pushNotifications: 'push_notifications',
    smsNotifications: 'sms_notifications',
  };
  const entries = Object.entries(payload).filter(([key]) => allowed[key]);

  await getNotificationPreferences(userId);

  if (!entries.length) {
    return getNotificationPreferences(userId);
  }

  const assignments = entries.map(([key]) => `${allowed[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => toDatabaseBoolean(value));
  await db.execute(`UPDATE notification_preferences SET ${assignments} WHERE user_id = ?`, [
    ...values,
    userId,
  ]);

  return getNotificationPreferences(userId);
}

export async function resetNotificationPreferences(userId) {
  await db.execute('DELETE FROM notification_preferences WHERE user_id = ?', [userId]);
  await db.execute('INSERT INTO notification_preferences (user_id) VALUES (?)', [userId]);
  return getNotificationPreferences(userId);
}

export async function recordNotificationHistory({ notificationId, userId, eventType, metadata }) {
  await ensureNotificationHistorySchema();
  await db.execute(
    `INSERT INTO notification_history (notification_id, user_id, event_type, metadata)
     VALUES (?, ?, ?, ?)`,
    [notificationId, userId, eventType, metadata ? JSON.stringify(metadata) : null],
  );
}

export async function createAnnouncement(payload) {
  await ensureAnnouncementScopeSchema();
  const [result] = await db.execute(
    `INSERT INTO announcements
      (uuid, title, body, attachment_path, audience_role, department_id, curriculum_id, course_id, week_no,
       priority, status, expiry_at, created_by, publish_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.title,
      payload.description,
      payload.attachmentPath || null,
      payload.audienceRole || null,
      payload.departmentId || null,
      payload.curriculumId || null,
      payload.courseId || null,
      payload.weekNo || null,
      payload.priority || 'normal',
      payload.status || 'draft',
      toMysqlDateTime(payload.expiryDate),
      payload.createdBy || null,
      toMysqlDateTime(payload.publishDate),
    ],
  );

  if (Array.isArray(payload.attachments) && payload.attachments.length) {
    await Promise.all(
      payload.attachments.map((attachment) =>
        db.execute(
          `INSERT INTO announcement_attachments
            (announcement_id, file_name, file_path, mime_type)
           VALUES (?, ?, ?, ?)`,
          [
            result.insertId,
            attachment.fileName || attachment.name || 'attachment',
            attachment.filePath || attachment.path || payload.attachmentPath || '',
            attachment.mimeType || null,
          ],
        ),
      ),
    );
  } else if (payload.attachmentPath) {
    await db.execute(
      `INSERT INTO announcement_attachments
        (announcement_id, file_name, file_path, mime_type)
       VALUES (?, ?, ?, ?)`,
      [result.insertId, payload.attachmentName || 'attachment', payload.attachmentPath, null],
    );
  }

  return result.insertId;
}

export async function findAnnouncementRawById(id) {
  await ensureAnnouncementScopeSchema();
  const [rows] = await db.execute(
    `SELECT id, uuid, title, body AS description, attachment_path AS attachmentPath,
      audience_role AS audienceRole, department_id AS departmentId, curriculum_id AS curriculumId,
      course_id AS courseId, week_no AS weekNo, priority, status, expiry_at AS expiryDate,
      created_by AS createdBy, publish_at AS publishDate, created_at AS createdAt,
      updated_at AS updatedAt
     FROM announcements
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
}

export async function updateAnnouncement(id, payload) {
  await ensureAnnouncementScopeSchema();
  const allowed = {
    title: 'title',
    description: 'body',
    attachmentPath: 'attachment_path',
    audienceRole: 'audience_role',
    departmentId: 'department_id',
    curriculumId: 'curriculum_id',
    courseId: 'course_id',
    weekNo: 'week_no',
    priority: 'priority',
    status: 'status',
    expiryDate: 'expiry_at',
    publishDate: 'publish_at',
  };
  const entries = Object.entries(payload).filter(([key]) => allowed[key]);

  if (!entries.length) {
    return false;
  }

  const assignments = entries.map(([key]) => `${allowed[key]} = ?`).join(', ');
  const values = entries.map(([key, value]) =>
    ['expiryDate', 'publishDate'].includes(key) ? toMysqlDateTime(value) : value,
  );
  const [result] = await db.execute(`UPDATE announcements SET ${assignments}, updated_at = NOW() WHERE id = ?`, [
    ...values,
    id,
  ]);

  if (Object.prototype.hasOwnProperty.call(payload, 'attachmentPath')) {
    await db.execute('DELETE FROM announcement_attachments WHERE announcement_id = ?', [id]);
    if (payload.attachmentPath) {
      await db.execute(
        `INSERT INTO announcement_attachments
          (announcement_id, file_name, file_path, mime_type)
         VALUES (?, ?, ?, ?)`,
        [id, payload.attachmentName || 'attachment', payload.attachmentPath, null],
      );
    }
  }

  return result.affectedRows > 0;
}

export async function deleteAnnouncement(id) {
  const [result] = await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function listAnnouncementTargets(announcementId) {
  await ensureAnnouncementTargetSchema();
  const [rows] = await db.execute(
    `SELECT at.target_type AS targetType, at.target_role AS targetRole, at.target_id AS targetId,
      CASE
        WHEN at.target_type = 'department' THEN d.name
        WHEN at.target_type = 'teacher' THEN teacher_user.full_name
        WHEN at.target_type = 'student' THEN student_user.full_name
        WHEN at.target_type = 'curriculum' THEN c.title
        ELSE NULL
      END AS targetName
     FROM announcement_targets at
     LEFT JOIN departments d ON d.id = at.target_id AND at.target_type = 'department'
     LEFT JOIN teachers t ON t.id = at.target_id AND at.target_type = 'teacher'
     LEFT JOIN users teacher_user ON teacher_user.id = t.user_id
     LEFT JOIN students s ON s.id = at.target_id AND at.target_type = 'student'
     LEFT JOIN users student_user ON student_user.id = s.user_id
     LEFT JOIN curriculums c ON c.id = at.target_id AND at.target_type = 'curriculum'
     WHERE announcement_id = ?`,
    [announcementId],
  );

  return rows;
}

async function listAnnouncementAttachments(announcementId) {
  const [rows] = await db.execute(
    `SELECT id, file_name AS fileName, file_path AS filePath, mime_type AS mimeType,
      uploaded_at AS uploadedAt
     FROM announcement_attachments
     WHERE announcement_id = ?`,
    [announcementId],
  );

  return rows;
}

function getAnnouncementOrderBy(sort) {
  const options = {
    oldest: 'a.created_at ASC',
    publishDate: 'a.publish_at DESC, a.created_at DESC',
    priority: "FIELD(a.priority, 'urgent', 'important', 'normal'), a.created_at DESC",
    status: 'a.status ASC, a.created_at DESC',
    newest: 'a.created_at DESC',
  };

  return options[sort] || options.newest;
}

function getAnnouncementVisibilitySql(user, canManage = false) {
  if (canManage) {
    return { targetSql: '1 = 1', targetValues: [user.id, user.id] };
  }

  const targetValues = [user.id, user.id, user.role, user.role, user.id, user.id];
  const departmentScopeSql = user.role === 'teacher'
    ? `AND (
      a.department_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM teacher_departments scope_td
        WHERE scope_td.teacher_id = t.id
          AND scope_td.department_id = a.department_id
      )
    )`
    : user.role === 'student'
      ? `AND (
        a.department_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM student_departments scope_sd
          WHERE scope_sd.student_id = s.id
            AND scope_sd.department_id = a.department_id
        )
      )`
      : '';
  const curriculumScopeSql = user.role === 'teacher'
    ? `AND (
      a.curriculum_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM curriculum_teachers scope_ct
        WHERE scope_ct.teacher_id = t.id
          AND scope_ct.curriculum_id = a.curriculum_id
      )
    )`
    : user.role === 'student'
      ? `AND (
        a.curriculum_id IS NULL
        OR s.curriculum_id = a.curriculum_id
        OR (
          s.curriculum_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM curriculums scope_curriculum
            INNER JOIN student_departments scope_curriculum_sd
              ON scope_curriculum_sd.student_id = s.id
              AND scope_curriculum_sd.department_id = scope_curriculum.department_id
            WHERE scope_curriculum.id = a.curriculum_id
          )
        )
      )`
      : '';
  const targetSql = `
    (a.audience_role IS NULL OR a.audience_role = ?)
    AND (
      at.id IS NULL
      OR at.target_type = 'all_users'
      OR (at.target_type = 'role' AND at.target_role = ?)
      OR (at.target_type = 'teacher' AND (at.target_id = ? OR at.target_id = t.id))
      OR (at.target_type = 'student' AND (at.target_id = ? OR at.target_id = s.id))
      OR (at.target_type = 'department' AND at.target_role = 'teacher' AND EXISTS (
        SELECT 1
        FROM teacher_departments visible_td
        WHERE visible_td.teacher_id = t.id
          AND visible_td.department_id = at.target_id
      ))
      OR (at.target_type = 'department' AND at.target_role = 'student' AND EXISTS (
        SELECT 1
        FROM student_departments visible_sd
        WHERE visible_sd.student_id = s.id
          AND visible_sd.department_id = at.target_id
      ))
      OR (at.target_type = 'curriculum' AND at.target_role = 'teacher' AND EXISTS (
        SELECT 1
        FROM curriculum_teachers visible_ct
        WHERE visible_ct.curriculum_id = at.target_id
          AND visible_ct.teacher_id = t.id
      ))
      OR (at.target_type = 'curriculum' AND at.target_role = 'student' AND (
        s.curriculum_id = at.target_id
        OR (
          s.curriculum_id IS NULL
          AND EXISTS (
            SELECT 1
            FROM curriculums visible_curriculum
            INNER JOIN student_departments visible_curriculum_sd
              ON visible_curriculum_sd.student_id = s.id
              AND visible_curriculum_sd.department_id = visible_curriculum.department_id
            WHERE visible_curriculum.id = at.target_id
          )
        )
      ))
    )
    ${departmentScopeSql}
    ${curriculumScopeSql}`;

  return { targetSql, targetValues };
}

function appendAnnouncementStatusFilter({ where, values, status, canManage }) {
  if (!canManage) {
    where.push("a.status = 'published'");
    where.push('(a.publish_at IS NULL OR a.publish_at <= NOW())');
    where.push('(a.expiry_at IS NULL OR a.expiry_at > NOW())');
    return;
  }

  if (status === 'scheduled') {
    where.push("a.status = 'published'");
    where.push('a.publish_at > NOW()');
    return;
  }

  if (status === 'expired') {
    where.push("(a.status = 'expired' OR a.expiry_at <= NOW())");
    return;
  }

  if (status) {
    where.push('a.status = ?');
    values.push(status);
  }
}

function getVisiblePublishedSql() {
  return [
    "a.status = 'published'",
    '(a.publish_at IS NULL OR a.publish_at <= NOW())',
    '(a.expiry_at IS NULL OR a.expiry_at > NOW())',
  ].join(' AND ');
}

export async function listAnnouncements({
  user,
  search,
  priority,
  status,
  sort = 'newest',
  visibleOnly = false,
  limit = 30,
  offset = 0,
}) {
  await ensureAnnouncementTargetSchema();
  await ensureAnnouncementScopeSchema();
  await ensureUserAssignmentSchema();
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const canModerateAll = !visibleOnly && ['super-admin', 'admin'].includes(user.role);
  const canManageOwn = !visibleOnly && user.role === 'teacher';
  const canManage = canModerateAll || canManageOwn;
  const { targetSql, targetValues } = getAnnouncementVisibilitySql(user, canModerateAll);
  const ownershipAwareTargetSql = canManageOwn
    ? `((${targetSql}) AND ${getVisiblePublishedSql()} OR a.created_by = ?)`
    : targetSql;
  const ownershipAwareTargetValues = canManageOwn ? [...targetValues, user.id] : targetValues;
  const where = [];
  const values = [];

  appendAnnouncementStatusFilter({ where, values, status, canManage });

  if (priority) {
    where.push('a.priority = ?');
    values.push(priority);
  }

  if (search) {
    where.push('(a.title LIKE ? OR a.body LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = where.length ? `AND ${where.join(' AND ')}` : '';
  const orderBy = getAnnouncementOrderBy(sort);
  const [rows] = await db.query(
    `SELECT DISTINCT a.id, a.uuid, a.title, a.body AS description, a.attachment_path AS attachmentPath,
      audience_role AS audienceRole, a.department_id AS departmentId, d.name AS departmentName,
      a.curriculum_id AS curriculumId, c.title AS curriculumName, a.course_id AS courseId,
      course.title AS subjectName, a.week_no AS weekNo, a.priority, a.status, a.expiry_at AS expiryDate,
      a.created_by AS createdBy, a.publish_at AS publishDate, a.created_at AS createdAt,
      a.updated_at AS updatedAt
     FROM announcements a
     LEFT JOIN announcement_targets at ON at.announcement_id = a.id
     LEFT JOIN departments d ON d.id = a.department_id
     LEFT JOIN curriculums c ON c.id = a.curriculum_id
     LEFT JOIN courses course ON course.id = a.course_id
     LEFT JOIN teachers t ON t.user_id = ?
     LEFT JOIN students s ON s.user_id = ?
     WHERE ${ownershipAwareTargetSql}
       ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...ownershipAwareTargetValues, ...values, safeLimit, safeOffset],
  );
  const [countRows] = await db.query(
    `SELECT COUNT(DISTINCT a.id) AS total
     FROM announcements a
     LEFT JOIN announcement_targets at ON at.announcement_id = a.id
     LEFT JOIN departments d ON d.id = a.department_id
     LEFT JOIN curriculums c ON c.id = a.curriculum_id
     LEFT JOIN courses course ON course.id = a.course_id
     LEFT JOIN teachers t ON t.user_id = ?
     LEFT JOIN students s ON s.user_id = ?
     WHERE ${ownershipAwareTargetSql}
       ${whereSql}`,
    [...ownershipAwareTargetValues, ...values],
  );

  const announcements = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      targets: await listAnnouncementTargets(row.id),
      attachments: await listAnnouncementAttachments(row.id),
    })),
  );

  return {
    announcements,
    total: countRows[0]?.total || 0,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function findAnnouncementById({ user, id }) {
  await ensureAnnouncementTargetSchema();
  await ensureAnnouncementScopeSchema();
  await ensureUserAssignmentSchema();
  const canModerateAll = ['super-admin', 'admin'].includes(user.role);
  const canManageOwn = user.role === 'teacher';
  const { targetSql, targetValues } = getAnnouncementVisibilitySql(user, canModerateAll);
  const ownershipAwareTargetSql = canManageOwn
    ? `((${targetSql}) AND ${getVisiblePublishedSql()} OR a.created_by = ?)`
    : targetSql;
  const ownershipAwareTargetValues = canManageOwn ? [...targetValues, user.id] : targetValues;
  const where = ['a.id = ?'];
  const values = [id];

  if (!canModerateAll && !canManageOwn) {
    where.push("a.status = 'published'");
    where.push('(a.publish_at IS NULL OR a.publish_at <= NOW())');
    where.push('(a.expiry_at IS NULL OR a.expiry_at > NOW())');
  }

  const [rows] = await db.query(
    `SELECT DISTINCT a.id, a.uuid, a.title, a.body AS description, a.attachment_path AS attachmentPath,
      audience_role AS audienceRole, a.department_id AS departmentId, d.name AS departmentName,
      a.curriculum_id AS curriculumId, c.title AS curriculumName, a.course_id AS courseId,
      course.title AS subjectName, a.week_no AS weekNo, a.priority, a.status, a.expiry_at AS expiryDate,
      a.created_by AS createdBy, a.publish_at AS publishDate, a.created_at AS createdAt,
      a.updated_at AS updatedAt
     FROM announcements a
     LEFT JOIN announcement_targets at ON at.announcement_id = a.id
     LEFT JOIN departments d ON d.id = a.department_id
     LEFT JOIN curriculums c ON c.id = a.curriculum_id
     LEFT JOIN courses course ON course.id = a.course_id
     LEFT JOIN teachers t ON t.user_id = ?
     LEFT JOIN students s ON s.user_id = ?
     WHERE ${ownershipAwareTargetSql}
       AND ${where.join(' AND ')}
     LIMIT 1`,
    [...ownershipAwareTargetValues, ...values],
  );

  const announcement = rows[0];

  if (!announcement) {
    return null;
  }

  return {
    ...announcement,
    targets: await listAnnouncementTargets(announcement.id),
    attachments: await listAnnouncementAttachments(announcement.id),
  };
}

export async function replaceAnnouncementTargets(announcementId, targets = []) {
  await ensureAnnouncementTargetSchema();
  await db.execute('DELETE FROM announcement_targets WHERE announcement_id = ?', [announcementId]);

  if (!targets.length) {
    await db.execute(
      'INSERT INTO announcement_targets (announcement_id, target_type) VALUES (?, ?)',
      [announcementId, 'all_users'],
    );
    return;
  }

  const normalizedTargets = targets.map((target) => ({
    targetType: target.targetType || target.type || 'all_users',
    targetRole: target.targetRole || target.role || null,
    targetId: target.targetId || target.id || null,
  }));

  await Promise.all(
    normalizedTargets.map((target) =>
      db.execute(
        `INSERT INTO announcement_targets
          (announcement_id, target_type, target_role, target_id)
         VALUES (?, ?, ?, ?)`,
        [announcementId, target.targetType, target.targetRole || null, target.targetId || null],
      ),
    ),
  );
}

async function listUsersByTarget(target, scope = {}) {
  await ensureAnnouncementTargetSchema();
  await ensureAnnouncementScopeSchema();

  if (target.targetType === 'role') {
    const [rows] = await db.execute(
      "SELECT id, role, full_name AS fullName FROM users WHERE status = 'active' AND role = ?",
      [target.targetRole],
    );
    return rows;
  }

  if (target.targetType === 'teacher') {
    const [rows] = await db.execute(
      `SELECT u.id, u.role, u.full_name AS fullName
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE u.status = 'active' AND (u.id = ? OR t.id = ?)`,
      [target.targetId, target.targetId],
    );
    return rows;
  }

  if (target.targetType === 'student') {
    const [rows] = await db.execute(
      `SELECT u.id, u.role, u.full_name AS fullName
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       WHERE u.status = 'active' AND (u.id = ? OR s.id = ?)`,
      [target.targetId, target.targetId],
    );
    return rows;
  }

  if (target.targetType === 'curriculum') {
    if (target.targetRole === 'student') {
      await ensureUserAssignmentSchema();
      const [rows] = await db.execute(
        `SELECT DISTINCT u.id, u.role, u.full_name AS fullName
         FROM users u
         INNER JOIN students s ON s.user_id = u.id
         WHERE u.status = 'active'
          AND u.role = 'student'
          AND (
            s.curriculum_id = ?
            OR (
              s.curriculum_id IS NULL
              AND EXISTS (
                SELECT 1
                FROM curriculums scoped_curriculum
                INNER JOIN student_departments scoped_sd
                  ON scoped_sd.student_id = s.id
                  AND scoped_sd.department_id = scoped_curriculum.department_id
                WHERE scoped_curriculum.id = ?
              )
            )
          )`,
        [target.targetId, target.targetId],
      );
      return rows;
    }

    const [rows] = await db.execute(
      `SELECT DISTINCT u.id, u.role, u.full_name AS fullName
       FROM users u
       INNER JOIN teachers t ON t.user_id = u.id
       INNER JOIN curriculum_teachers ct ON ct.teacher_id = t.id
       WHERE u.status = 'active'
        AND u.role = 'teacher'
        AND ct.curriculum_id = ?`,
      [target.targetId],
    );
    return rows;
  }

  if (target.targetType === 'department') {
    await ensureUserAssignmentSchema();

    if (target.targetRole === 'teacher') {
      const curriculumFilter = scope.curriculumId
        ? 'AND EXISTS (SELECT 1 FROM curriculum_teachers ct WHERE ct.teacher_id = t.id AND ct.curriculum_id = ?)'
        : '';
      const [rows] = await db.execute(
        `SELECT DISTINCT u.id, u.role, u.full_name AS fullName
         FROM users u
         INNER JOIN teachers t ON t.user_id = u.id
         INNER JOIN teacher_departments td ON td.teacher_id = t.id
         INNER JOIN departments d ON d.id = td.department_id
         WHERE u.status = 'active'
          AND u.role = 'teacher'
          AND d.status = 'active'
          AND td.department_id = ?
          ${curriculumFilter}`,
        scope.curriculumId ? [target.targetId, scope.curriculumId] : [target.targetId],
      );
      return rows;
    }

    if (target.targetRole === 'student') {
      const curriculumFilter = scope.curriculumId
        ? `AND (
          s.curriculum_id = ?
          OR (
            s.curriculum_id IS NULL
            AND EXISTS (
              SELECT 1
              FROM curriculums scoped_curriculum
              WHERE scoped_curriculum.id = ?
                AND scoped_curriculum.department_id = sd.department_id
            )
          )
        )`
        : '';
      const [rows] = await db.execute(
        `SELECT DISTINCT u.id, u.role, u.full_name AS fullName
         FROM users u
         INNER JOIN students s ON s.user_id = u.id
         INNER JOIN student_departments sd ON sd.student_id = s.id
         INNER JOIN departments d ON d.id = sd.department_id
         WHERE u.status = 'active'
          AND u.role = 'student'
          AND d.status = 'active'
          AND sd.department_id = ?
          ${curriculumFilter}`,
        scope.curriculumId
          ? [target.targetId, scope.curriculumId, scope.curriculumId]
          : [target.targetId],
      );
      return rows;
    }
  }

  if (target.targetType === 'batch') {
    const [rows] = await db.execute(
      `SELECT u.id, u.role, u.full_name AS fullName
       FROM users u
       INNER JOIN students s ON s.user_id = u.id
       WHERE u.status = 'active' AND s.enrollment_year = ?`,
      [target.targetId],
    );
    return rows;
  }

  return [];
}

export async function listUsersForAnnouncement({ audienceRole, targets = [], scope = {} }) {
  const normalizedTargets = targets.length
    ? targets
    : [{ targetType: audienceRole ? 'role' : 'all_users', targetRole: audienceRole || null }];

  if (normalizedTargets.some((target) => target.targetType === 'all_users')) {
    const [rows] = await db.execute(
      "SELECT id, role, full_name AS fullName FROM users WHERE status = 'active'",
    );
    return rows;
  }

  const targetUsers = await Promise.all(normalizedTargets.map((target) => listUsersByTarget(target, scope)));
  const byId = new Map();

  targetUsers.flat().forEach((targetUser) => {
    byId.set(targetUser.id, targetUser);
  });

  return [...byId.values()];
}

export async function createReminderNotification(payload) {
  return createNotification({
    ...payload,
    notificationType: 'reminder',
    sourceModule: payload.sourceModule || 'reminders',
  });
}

export const realtimeNotificationArchitecture = {
  websocket: false,
  socketIo: false,
  serverSentEvents: false,
  backgroundQueue: false,
};

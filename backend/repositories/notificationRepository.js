import { db } from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

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

  const whereSql = where.join(' AND ');
  const [rows] = await db.query(
    `${notificationSelect}
     WHERE ${whereSql}
     ORDER BY is_read ASC, created_at DESC
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
  const values = entries.map(([, value]) => (value ? 1 : 0));
  await db.execute(`UPDATE notification_preferences SET ${assignments} WHERE user_id = ?`, [
    ...values,
    userId,
  ]);

  return getNotificationPreferences(userId);
}

export async function recordNotificationHistory({ notificationId, userId, eventType, metadata }) {
  await db.execute(
    `INSERT INTO notification_history (notification_id, user_id, event_type, metadata)
     VALUES (?, ?, ?, ?)`,
    [notificationId, userId, eventType, metadata ? JSON.stringify(metadata) : null],
  );
}

export async function createAnnouncement(payload) {
  const [result] = await db.execute(
    `INSERT INTO announcements
      (uuid, title, body, attachment_path, audience_role, priority, status, expiry_at, created_by, publish_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.title,
      payload.description,
      payload.attachmentPath || null,
      payload.audienceRole || null,
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

export async function updateAnnouncement(id, payload) {
  const allowed = {
    title: 'title',
    description: 'body',
    attachmentPath: 'attachment_path',
    audienceRole: 'audience_role',
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
  const [result] = await db.execute(`UPDATE announcements SET ${assignments} WHERE id = ?`, [
    ...values,
    id,
  ]);

  return result.affectedRows > 0;
}

export async function deleteAnnouncement(id) {
  const [result] = await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function listAnnouncementTargets(announcementId) {
  const [rows] = await db.execute(
    `SELECT target_type AS targetType, target_role AS targetRole, target_id AS targetId
     FROM announcement_targets
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
  const targetSql = `
    (a.audience_role IS NULL OR a.audience_role = ?)
    AND (
      at.id IS NULL
      OR at.target_type = 'all_users'
      OR (at.target_type = 'role' AND at.target_role = ?)
      OR (at.target_type = 'teacher' AND (at.target_id = ? OR at.target_id = t.id))
      OR (at.target_type = 'student' AND (at.target_id = ? OR at.target_id = s.id))
      OR (at.target_type = 'curriculum' AND EXISTS (
        SELECT 1 FROM courses c WHERE c.curriculum_id = at.target_id AND c.teacher_id = t.id
      ))
    )`;

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

export async function listAnnouncements({
  user,
  search,
  priority,
  status,
  sort = 'newest',
  limit = 30,
  offset = 0,
}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const canManage = ['super-admin', 'admin', 'teacher'].includes(user.role);
  const { targetSql, targetValues } = getAnnouncementVisibilitySql(user, canManage);
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
      audience_role AS audienceRole, priority, status, expiry_at AS expiryDate,
      created_by AS createdBy, publish_at AS publishDate, a.created_at AS createdAt,
      a.updated_at AS updatedAt
     FROM announcements a
     LEFT JOIN announcement_targets at ON at.announcement_id = a.id
     LEFT JOIN teachers t ON t.user_id = ?
     LEFT JOIN students s ON s.user_id = ?
     WHERE ${targetSql}
       ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...targetValues, ...values, safeLimit, safeOffset],
  );
  const [countRows] = await db.query(
    `SELECT COUNT(DISTINCT a.id) AS total
     FROM announcements a
     LEFT JOIN announcement_targets at ON at.announcement_id = a.id
     LEFT JOIN teachers t ON t.user_id = ?
     LEFT JOIN students s ON s.user_id = ?
     WHERE ${targetSql}
       ${whereSql}`,
    [...targetValues, ...values],
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
  const canManage = ['super-admin', 'admin', 'teacher'].includes(user.role);
  const { targetSql, targetValues } = getAnnouncementVisibilitySql(user, canManage);
  const where = ['a.id = ?'];
  const values = [id];

  if (!canManage) {
    where.push("a.status = 'published'");
    where.push('(a.publish_at IS NULL OR a.publish_at <= NOW())');
    where.push('(a.expiry_at IS NULL OR a.expiry_at > NOW())');
  }

  const [rows] = await db.query(
    `SELECT DISTINCT a.id, a.uuid, a.title, a.body AS description, a.attachment_path AS attachmentPath,
      audience_role AS audienceRole, priority, status, expiry_at AS expiryDate,
      created_by AS createdBy, publish_at AS publishDate, a.created_at AS createdAt,
      a.updated_at AS updatedAt
     FROM announcements a
     LEFT JOIN announcement_targets at ON at.announcement_id = a.id
     LEFT JOIN teachers t ON t.user_id = ?
     LEFT JOIN students s ON s.user_id = ?
     WHERE ${targetSql}
       AND ${where.join(' AND ')}
     LIMIT 1`,
    [...targetValues, ...values],
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
  await db.execute('DELETE FROM announcement_targets WHERE announcement_id = ?', [announcementId]);

  if (!targets.length) {
    await db.execute(
      'INSERT INTO announcement_targets (announcement_id, target_type) VALUES (?, ?)',
      [announcementId, 'all_users'],
    );
    return;
  }

  await Promise.all(
    targets.map((target) =>
      db.execute(
        `INSERT INTO announcement_targets
          (announcement_id, target_type, target_role, target_id)
         VALUES (?, ?, ?, ?)`,
        [announcementId, target.targetType, target.targetRole || null, target.targetId || null],
      ),
    ),
  );
}

async function listUsersByTarget(target) {
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
    const [rows] = await db.execute(
      `SELECT DISTINCT u.id, u.role, u.full_name AS fullName
       FROM users u
       INNER JOIN teachers t ON t.user_id = u.id
       INNER JOIN courses c ON c.teacher_id = t.id
       WHERE u.status = 'active' AND c.curriculum_id = ?`,
      [target.targetId],
    );
    return rows;
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

export async function listUsersForAnnouncement({ audienceRole, targets = [] }) {
  const normalizedTargets = targets.length
    ? targets
    : [{ targetType: audienceRole ? 'role' : 'all_users', targetRole: audienceRole || null }];

  if (normalizedTargets.some((target) => target.targetType === 'all_users')) {
    const [rows] = await db.execute(
      "SELECT id, role, full_name AS fullName FROM users WHERE status = 'active'",
    );
    return rows;
  }

  const targetUsers = await Promise.all(normalizedTargets.map((target) => listUsersByTarget(target)));
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

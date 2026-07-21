import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/database.js';
import { ensureStudentCurriculumSchema } from './curriculumRepository.js';
import { ensureDepartmentSchema } from './departmentRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profileUploadDirectory = path.resolve(__dirname, '..', 'uploads', 'profiles');

const profileSelect = `SELECT u.id, u.uuid, u.full_name AS fullName, u.username, u.email,
  u.phone, u.role, u.status, u.profile_photo AS profilePhoto, u.last_login AS lastLogin,
  u.created_at AS joinedDate, up.address, up.bio,
  CASE WHEN u.role = 'teacher' THEN COALESCE(d.name, t.department, up.department) ELSE up.department END AS department,
  CASE WHEN u.role = 'teacher' THEN COALESCE(t.specialization, up.qualification) ELSE up.qualification END AS qualification,
  CASE WHEN u.role = 'student' THEN COALESCE(sc.title, s.program, up.curriculum) ELSE up.curriculum END AS curriculum,
  up.employee_id AS employeeId,
  CASE WHEN u.role = 'student' THEN COALESCE(s.student_no, up.student_id) ELSE up.student_id END AS studentId,
  up.phone_visibility AS phoneVisibility, up.email_visibility AS emailVisibility,
  up.profile_visibility AS profileVisibility, up.password_changed_at AS passwordChangedAt,
  up.last_failed_login AS lastFailedLogin
 FROM users u
 LEFT JOIN user_profiles up ON up.user_id = u.id
 LEFT JOIN teachers t ON t.user_id = u.id
 LEFT JOIN departments d ON d.id = t.department_id
 LEFT JOIN students s ON s.user_id = u.id
 LEFT JOIN curriculums sc ON sc.id = s.curriculum_id`;

export async function ensureUserProfile(userId) {
  await db.execute('INSERT IGNORE INTO user_profiles (user_id) VALUES (?)', [userId]);
  await db.execute('INSERT IGNORE INTO user_preferences (user_id) VALUES (?)', [userId]);
}

export async function getProfile(userId) {
  await ensureDepartmentSchema();
  await ensureStudentCurriculumSchema();
  await ensureUserProfile(userId);
  const [rows] = await db.execute(`${profileSelect} WHERE u.id = ? LIMIT 1`, [userId]);
  return rows[0] || null;
}

export async function updateProfile(userId, payload) {
  const userFields = {};
  const profileFields = {};

  if (payload.fullName !== undefined) userFields.full_name = payload.fullName;
  if (payload.email !== undefined) userFields.email = payload.email;
  if (payload.phone !== undefined) userFields.phone = payload.phone;
  if (payload.address !== undefined) profileFields.address = payload.address;
  if (payload.bio !== undefined) profileFields.bio = payload.bio;
  if (payload.department !== undefined) profileFields.department = payload.department;
  if (payload.qualification !== undefined) profileFields.qualification = payload.qualification;
  if (payload.curriculum !== undefined) profileFields.curriculum = payload.curriculum;
  if (payload.employeeId !== undefined) profileFields.employee_id = payload.employeeId;
  if (payload.studentId !== undefined) profileFields.student_id = payload.studentId;

  if (Object.keys(userFields).length) {
    const assignments = Object.keys(userFields).map((key) => `${key} = ?`).join(', ');
    await db.execute(`UPDATE users SET ${assignments} WHERE id = ?`, [
      ...Object.values(userFields),
      userId,
    ]);
  }

  if (Object.keys(profileFields).length) {
    await ensureUserProfile(userId);
    const assignments = Object.keys(profileFields).map((key) => `${key} = ?`).join(', ');
    await db.execute(`UPDATE user_profiles SET ${assignments} WHERE user_id = ?`, [
      ...Object.values(profileFields),
      userId,
    ]);
  }
}

export async function isEmailAvailable(email, userId) {
  const [rows] = await db.execute('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [
    email,
    userId,
  ]);
  return rows.length === 0;
}

function resolveProfilePhotoPath(photo) {
  const candidate = photo.file_path || photo.filePath || photo.file_name || photo.fileName || photo.profilePhoto;

  if (!candidate) {
    return null;
  }

  return path.isAbsolute(candidate)
    ? path.resolve(candidate)
    : path.resolve(profileUploadDirectory, candidate);
}

async function listProfilePhotoFiles(userId) {
  const [photoRows] = await db.execute(
    'SELECT file_name AS fileName, file_path AS filePath FROM profile_photos WHERE user_id = ?',
    [userId],
  );
  const [userRows] = await db.execute(
    'SELECT profile_photo AS profilePhoto FROM users WHERE id = ? AND profile_photo IS NOT NULL LIMIT 1',
    [userId],
  );

  return [...photoRows, ...userRows];
}

async function deleteStoredProfilePhotos(photos) {
  const allowedRoot = `${profileUploadDirectory}${path.sep}`;
  const paths = new Set(
    photos
      .map(resolveProfilePhotoPath)
      .filter((filePath) => filePath && filePath.startsWith(allowedRoot)),
  );

  await Promise.all(
    [...paths].map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }),
  );
}

async function clearProfilePhotoReferences(userId) {
  const photos = await listProfilePhotoFiles(userId);
  await db.execute('DELETE FROM profile_photos WHERE user_id = ?', [userId]);
  await db.execute('UPDATE users SET profile_photo = NULL WHERE id = ?', [userId]);
  await deleteStoredProfilePhotos(photos);
}

export async function saveProfilePhoto(userId, file) {
  await clearProfilePhotoReferences(userId);
  await db.execute(
    `INSERT INTO profile_photos (user_id, file_name, file_path, mime_type, file_size)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, file.filename, file.path, file.mimetype, file.size],
  );
  await db.execute('UPDATE users SET profile_photo = ? WHERE id = ?', [file.filename, userId]);
}

export async function removeProfilePhoto(userId) {
  await clearProfilePhotoReferences(userId);
}

export async function touchPasswordChanged(userId) {
  await ensureUserProfile(userId);
  await db.execute('UPDATE user_profiles SET password_changed_at = NOW() WHERE user_id = ?', [userId]);
}

export async function listLoginHistory(userId, { limit = 30, offset = 0, search, status } = {}) {
  const values = [userId];
  const where = ['user_id = ?'];

  if (status) {
    where.push('status = ?');
    values.push(status);
  }

  if (search) {
    where.push('(ip_address LIKE ? OR browser LIKE ? OR operating_system LIKE ? OR location LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const [rows] = await db.execute(
    `SELECT login_at AS loginDate, logout_at AS logoutDate, ip_address AS ipAddress,
      browser, operating_system AS operatingSystem, location, status
     FROM login_history
     WHERE ${where.join(' AND ')}
     UNION ALL
     SELECT login_time AS loginDate, logout_time AS logoutDate, ip_address AS ipAddress,
      user_agent AS browser, JSON_UNQUOTE(JSON_EXTRACT(device_info, '$.os')) AS operatingSystem,
      NULL AS location, 'successful' AS status
     FROM user_sessions
     WHERE user_id = ? AND NOT EXISTS (SELECT 1 FROM login_history WHERE user_id = ?)
     ORDER BY loginDate DESC
     LIMIT ? OFFSET ?`,
    [...values, userId, userId, limit, offset],
  );
  return rows;
}

export async function listSessions(userId) {
  const [rows] = await db.execute(
    `SELECT s.id, s.id AS sessionId, s.login_time AS loginAt, s.logout_time AS logoutAt,
      COALESCE(a.last_seen_at, s.login_time) AS lastSeenAt,
      s.ip_address AS ipAddress, s.user_agent AS userAgent, s.device_info AS deviceInfo,
      NULL AS location,
      CASE WHEN logout_time IS NULL THEN 1 ELSE 0 END AS isActive,
      'user_sessions' AS source
     FROM user_sessions s
     LEFT JOIN active_sessions a
      ON a.session_id = s.id AND a.user_id = s.user_id AND a.revoked_at IS NULL
     WHERE s.user_id = ? AND s.logout_time IS NULL
     UNION ALL
     SELECT id, COALESCE(session_id, id) AS sessionId, login_at AS loginAt, revoked_at AS logoutAt,
      last_seen_at AS lastSeenAt,
      ip_address AS ipAddress, user_agent AS userAgent, device_info AS deviceInfo,
      NULL AS location,
      CASE WHEN revoked_at IS NULL THEN 1 ELSE 0 END AS isActive,
      'active_sessions' AS source
     FROM active_sessions
     WHERE user_id = ? AND session_id IS NULL AND revoked_at IS NULL
     ORDER BY loginAt DESC
     LIMIT 25`,
    [userId, userId],
  );
  return rows;
}

export async function closeSession({ userId, sessionId }) {
  const [activeResult] = await db.execute(
    'UPDATE active_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE user_id = ? AND (id = ? OR session_id = ?)',
    [userId, sessionId, sessionId],
  );
  const [result] = await db.execute(
    'UPDATE user_sessions SET logout_time = COALESCE(logout_time, NOW()) WHERE id = ? AND user_id = ?',
    [sessionId, userId],
  );
  return activeResult.affectedRows > 0 || result.affectedRows > 0;
}

export async function closeAllSessions(userId, exceptSessionId = null) {
  const values = [userId];
  let exception = '';

  if (exceptSessionId) {
    exception = 'AND id <> ?';
    values.push(exceptSessionId);
  }

  const [result] = await db.execute(
    `UPDATE user_sessions SET logout_time = COALESCE(logout_time, NOW())
     WHERE user_id = ? AND logout_time IS NULL ${exception}`,
    values,
  );
  const [activeResult] = await db.execute(
    `UPDATE active_sessions SET revoked_at = COALESCE(revoked_at, NOW())
     WHERE user_id = ? AND revoked_at IS NULL ${exceptSessionId ? 'AND (session_id IS NULL OR session_id <> ?)' : ''}`,
    values,
  );
  return result.affectedRows + activeResult.affectedRows;
}

export async function getUserPreferences(userId) {
  await ensureUserProfile(userId);
  const [rows] = await db.execute(
    `SELECT theme_preference AS themePreference, language_preference AS languagePreference,
      timezone, preferences
     FROM user_preferences WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

export async function updateUserPreferences(userId, payload) {
  await ensureUserProfile(userId);
  await db.execute(
    `UPDATE user_preferences
     SET theme_preference = COALESCE(?, theme_preference),
      language_preference = COALESCE(?, language_preference),
      timezone = COALESCE(?, timezone),
      preferences = COALESCE(?, preferences)
     WHERE user_id = ?`,
    [
      payload.themePreference || null,
      payload.languagePreference || null,
      payload.timezone || null,
      payload.preferences ? JSON.stringify(payload.preferences) : null,
      userId,
    ],
  );
  return getUserPreferences(userId);
}

export async function listSecurityEvents(userId) {
  const [rows] = await db.execute(
    `SELECT event_type AS eventType, description, ip_address AS ipAddress, metadata, created_at AS createdAt
     FROM security_events
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId],
  );
  return rows;
}

export async function createSecurityEvent(payload) {
  await db.execute(
    `INSERT INTO security_events (user_id, event_type, description, ip_address, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.userId,
      payload.eventType,
      payload.description,
      payload.ipAddress || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
}

import { db } from '../config/database.js';

export async function createUserSession({ userId, ipAddress, userAgent, deviceInfo = null }) {
  const serializedDeviceInfo = deviceInfo ? JSON.stringify(deviceInfo) : null;
  const [result] = await db.execute(
    `INSERT INTO user_sessions (user_id, ip_address, user_agent, device_info)
     VALUES (?, ?, ?, ?)`,
    [userId, ipAddress || null, userAgent || null, serializedDeviceInfo],
  );

  await db.execute(
    `INSERT INTO active_sessions (user_id, session_id, ip_address, user_agent, device_info)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, result.insertId, ipAddress || null, userAgent || null, serializedDeviceInfo],
  );

  return result.insertId;
}

export async function closeUserSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  await db.execute('UPDATE user_sessions SET logout_time = NOW() WHERE id = ?', [sessionId]);
  await db.execute('UPDATE active_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE session_id = ?', [sessionId]);
  return true;
}

export async function touchUserSession({ sessionId, userId }) {
  if (!sessionId || !userId) {
    return false;
  }

  const [result] = await db.execute(
    `UPDATE active_sessions
     SET last_seen_at = NOW()
     WHERE session_id = ? AND user_id = ? AND revoked_at IS NULL`,
    [sessionId, userId],
  );

  return result.affectedRows > 0;
}

export async function isUserSessionActive({ sessionId, userId }) {
  if (!sessionId || !userId) {
    return false;
  }

  const [rows] = await db.execute(
    `SELECT id FROM user_sessions
     WHERE id = ? AND user_id = ? AND logout_time IS NULL
     LIMIT 1`,
    [sessionId, userId],
  );

  if (!rows.length) {
    return false;
  }

  const [activeRows] = await db.execute(
    `SELECT id FROM active_sessions
     WHERE session_id = ? AND user_id = ? AND revoked_at IS NOT NULL
     LIMIT 1`,
    [sessionId, userId],
  );

  return activeRows.length === 0;
}

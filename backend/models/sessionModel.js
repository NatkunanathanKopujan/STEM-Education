import { db } from '../config/database.js';

export async function createUserSession({ userId, ipAddress, userAgent, deviceInfo = null }) {
  const serializedDeviceInfo = deviceInfo ? JSON.stringify(deviceInfo) : null;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO user_sessions (user_id, ip_address, user_agent, device_info)
       VALUES (?, ?, ?, ?)`,
      [userId, ipAddress || null, userAgent || null, serializedDeviceInfo],
    );

    await connection.execute(
      `INSERT INTO active_sessions (user_id, session_id, ip_address, user_agent, device_info)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, result.insertId, ipAddress || null, userAgent || null, serializedDeviceInfo],
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeUserSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [sessionResult] = await connection.execute(
      'UPDATE user_sessions SET logout_time = COALESCE(logout_time, NOW()) WHERE id = ?',
      [sessionId],
    );
    const [activeResult] = await connection.execute(
      'UPDATE active_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE session_id = ?',
      [sessionId],
    );
    await connection.commit();
    return sessionResult.affectedRows > 0 || activeResult.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
    `SELECT s.id
     FROM user_sessions s
     INNER JOIN active_sessions a
      ON a.session_id = s.id
      AND a.user_id = s.user_id
      AND a.revoked_at IS NULL
     WHERE s.id = ? AND s.user_id = ? AND s.logout_time IS NULL
     LIMIT 1`,
    [sessionId, userId],
  );

  return rows.length > 0;
}

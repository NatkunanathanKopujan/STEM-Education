import { db } from '../config/database.js';

export async function createUserSession({ userId, ipAddress, userAgent, deviceInfo = null }) {
  const [result] = await db.execute(
    `INSERT INTO user_sessions (user_id, ip_address, user_agent, device_info)
     VALUES (?, ?, ?, ?)`,
    [userId, ipAddress || null, userAgent || null, deviceInfo ? JSON.stringify(deviceInfo) : null],
  );

  return result.insertId;
}

export async function closeUserSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  await db.execute('UPDATE user_sessions SET logout_time = NOW() WHERE id = ?', [sessionId]);
  return true;
}

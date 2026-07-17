import { db } from '../config/database.js';

function parseSettingValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapSetting(row) {
  return {
    id: row.id,
    settingKey: row.settingKey,
    settingValue: parseSettingValue(row.settingValue),
    description: row.description,
    updatedBy: row.updatedBy,
    updatedByName: row.updatedByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const settingsSelect = `SELECT s.id, s.setting_key AS settingKey, s.setting_value AS settingValue,
  s.description, s.updated_by AS updatedBy, u.full_name AS updatedByName,
  s.created_at AS createdAt, s.updated_at AS updatedAt
 FROM settings s
 LEFT JOIN users u ON u.id = s.updated_by`;

export async function listSettings({ search, limit = 100, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const where = [];
  const values = [];

  if (search) {
    where.push('(s.setting_key LIKE ? OR s.description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(
    `${settingsSelect}
     ${whereSql}
     ORDER BY s.setting_key ASC
     LIMIT ? OFFSET ?`,
    [...values, safeLimit, safeOffset],
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM settings s ${whereSql}`,
    values,
  );

  return {
    settings: rows.map(mapSetting),
    total: countRows[0]?.total || 0,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function findSettingByKey(settingKey, connection = db) {
  const [rows] = await connection.execute(`${settingsSelect} WHERE s.setting_key = ? LIMIT 1`, [
    settingKey,
  ]);
  return rows[0] ? mapSetting(rows[0]) : null;
}

export async function createSetting({ settingKey, settingValue, description, updatedBy }) {
  const [result] = await db.execute(
    `INSERT INTO settings (setting_key, setting_value, description, updated_by)
     VALUES (?, ?, ?, ?)`,
    [
      settingKey,
      JSON.stringify(settingValue ?? null),
      description || null,
      updatedBy || null,
    ],
  );

  return result.insertId;
}

export async function updateSetting(settingKey, { settingValue, description, updatedBy }) {
  const assignments = [];
  const values = [];

  if (Object.prototype.hasOwnProperty.call({ settingValue }, 'settingValue')) {
    assignments.push('setting_value = ?');
    values.push(JSON.stringify(settingValue ?? null));
  }

  if (description !== undefined) {
    assignments.push('description = ?');
    values.push(description || null);
  }

  assignments.push('updated_by = ?');
  values.push(updatedBy || null);
  assignments.push('updated_at = CURRENT_TIMESTAMP');

  const [result] = await db.execute(
    `UPDATE settings SET ${assignments.join(', ')} WHERE setting_key = ?`,
    [...values, settingKey],
  );

  return result.affectedRows > 0;
}

export async function upsertSetting(payload, connection = db) {
  await connection.execute(
    `INSERT INTO settings (setting_key, setting_value, description, updated_by)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value),
       description = VALUES(description),
       updated_by = VALUES(updated_by),
       updated_at = CURRENT_TIMESTAMP`,
    [
      payload.settingKey,
      JSON.stringify(payload.settingValue ?? null),
      payload.description || null,
      payload.updatedBy || null,
    ],
  );

  return findSettingByKey(payload.settingKey, connection);
}

export async function deleteSetting(settingKey) {
  const [result] = await db.execute('DELETE FROM settings WHERE setting_key = ?', [settingKey]);
  return result.affectedRows > 0;
}

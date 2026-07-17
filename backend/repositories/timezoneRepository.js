import { db } from '../config/database.js';

function mapTimezone(row) {
  return {
    id: row.id,
    name: row.name,
    utcOffset: row.utcOffset,
    status: row.status,
    isDefault: Boolean(row.isDefault),
    description: row.description,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    updatedBy: row.updatedBy,
    updatedByName: row.updatedByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const timezoneSelect = `SELECT tz.id, tz.name, tz.utc_offset AS utcOffset,
  tz.status, tz.is_default AS isDefault, tz.description,
  tz.created_by AS createdBy, creator.full_name AS createdByName,
  tz.updated_by AS updatedBy, updater.full_name AS updatedByName,
  tz.created_at AS createdAt, tz.updated_at AS updatedAt
 FROM timezones tz
 LEFT JOIN users creator ON creator.id = tz.created_by
 LEFT JOIN users updater ON updater.id = tz.updated_by`;

export async function listTimezones({ search, status, limit = 100, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const where = [];
  const values = [];

  if (search) {
    where.push('(tz.name LIKE ? OR tz.utc_offset LIKE ? OR tz.description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    where.push('tz.status = ?');
    values.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(
    `${timezoneSelect}
     ${whereSql}
     ORDER BY tz.is_default DESC, tz.name ASC
     LIMIT ? OFFSET ?`,
    [...values, safeLimit, safeOffset],
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM timezones tz ${whereSql}`,
    values,
  );

  return {
    timezones: rows.map(mapTimezone),
    total: countRows[0]?.total || 0,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function findTimezoneById(id, connection = db) {
  const [rows] = await connection.execute(`${timezoneSelect} WHERE tz.id = ? LIMIT 1`, [id]);
  return rows[0] ? mapTimezone(rows[0]) : null;
}

export async function findTimezoneByName(name, connection = db) {
  const [rows] = await connection.execute(`${timezoneSelect} WHERE tz.name = ? LIMIT 1`, [name]);
  return rows[0] ? mapTimezone(rows[0]) : null;
}

export async function findDefaultTimezone(connection = db) {
  const [rows] = await connection.execute(
    `${timezoneSelect} WHERE tz.is_default = 1 ORDER BY tz.updated_at DESC LIMIT 1`,
  );
  return rows[0] ? mapTimezone(rows[0]) : null;
}

export async function findFallbackTimezone(connection = db) {
  const [rows] = await connection.execute(
    `${timezoneSelect}
     ORDER BY CASE tz.status WHEN 'active' THEN 0 ELSE 1 END, tz.name ASC
     LIMIT 1`,
  );
  return rows[0] ? mapTimezone(rows[0]) : null;
}

export async function createTimezoneRecord(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO timezones
      (name, utc_offset, status, is_default, description, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.utcOffset || null,
      payload.status,
      payload.isDefault ? 1 : 0,
      payload.description || null,
      payload.createdBy || null,
      payload.updatedBy || null,
    ],
  );

  return result.insertId;
}

export async function updateTimezoneRecord(id, payload, connection = db) {
  const fields = [];
  const values = [];
  const fieldMap = {
    name: 'name',
    utcOffset: 'utc_offset',
    status: 'status',
    isDefault: 'is_default',
    description: 'description',
    updatedBy: 'updated_by',
  };

  Object.entries(fieldMap).forEach(([key, column]) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      fields.push(`${column} = ?`);
      values.push(key === 'isDefault' ? (payload[key] ? 1 : 0) : payload[key] || null);
    }
  });

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const [result] = await connection.execute(
    `UPDATE timezones SET ${fields.join(', ')} WHERE id = ?`,
    [...values, id],
  );

  return result.affectedRows > 0;
}

export async function clearDefaultTimezones(exceptId = null, connection = db) {
  if (exceptId) {
    await connection.execute('UPDATE timezones SET is_default = 0 WHERE id <> ?', [exceptId]);
    return;
  }

  await connection.execute('UPDATE timezones SET is_default = 0');
}

export async function setDefaultTimezone(id, connection = db) {
  await connection.execute('UPDATE timezones SET is_default = 1 WHERE id = ?', [id]);
}

export async function deleteTimezoneRecord(id, connection = db) {
  const [result] = await connection.execute('DELETE FROM timezones WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function withTimezoneTransaction(callback) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

import { db } from '../config/database.js';

function mapAcademicYear(row) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    isCurrent: Boolean(row.isCurrent),
    description: row.description,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    updatedBy: row.updatedBy,
    updatedByName: row.updatedByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const academicYearSelect = `SELECT ay.id, ay.name,
  ay.start_date AS startDate, ay.end_date AS endDate,
  ay.status, ay.is_current AS isCurrent, ay.description,
  ay.created_by AS createdBy, creator.full_name AS createdByName,
  ay.updated_by AS updatedBy, updater.full_name AS updatedByName,
  ay.created_at AS createdAt, ay.updated_at AS updatedAt
 FROM academic_years ay
 LEFT JOIN users creator ON creator.id = ay.created_by
 LEFT JOIN users updater ON updater.id = ay.updated_by`;

export async function listAcademicYears({ search, status, limit = 100, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const where = [];
  const values = [];

  if (search) {
    where.push('(ay.name LIKE ? OR ay.description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    where.push('ay.status = ?');
    values.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(
    `${academicYearSelect}
     ${whereSql}
     ORDER BY ay.is_current DESC, ay.start_date DESC, ay.name DESC
     LIMIT ? OFFSET ?`,
    [...values, safeLimit, safeOffset],
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM academic_years ay ${whereSql}`,
    values,
  );

  return {
    academicYears: rows.map(mapAcademicYear),
    total: countRows[0]?.total || 0,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function findAcademicYearById(id, connection = db) {
  const [rows] = await connection.execute(`${academicYearSelect} WHERE ay.id = ? LIMIT 1`, [id]);
  return rows[0] ? mapAcademicYear(rows[0]) : null;
}

export async function findAcademicYearByName(name, connection = db) {
  const [rows] = await connection.execute(`${academicYearSelect} WHERE ay.name = ? LIMIT 1`, [
    name,
  ]);
  return rows[0] ? mapAcademicYear(rows[0]) : null;
}

export async function findCurrentAcademicYear(connection = db) {
  const [rows] = await connection.execute(
    `${academicYearSelect} WHERE ay.is_current = 1 ORDER BY ay.updated_at DESC LIMIT 1`,
  );
  return rows[0] ? mapAcademicYear(rows[0]) : null;
}

export async function findFallbackAcademicYear(connection = db) {
  const [rows] = await connection.execute(
    `${academicYearSelect}
     ORDER BY
       CASE ay.status WHEN 'active' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END,
       ay.start_date DESC,
       ay.id DESC
     LIMIT 1`,
  );
  return rows[0] ? mapAcademicYear(rows[0]) : null;
}

export async function createAcademicYearRecord(payload, connection = db) {
  const [result] = await connection.execute(
    `INSERT INTO academic_years
      (name, start_date, end_date, status, is_current, description, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.startDate || null,
      payload.endDate || null,
      payload.status,
      payload.isCurrent ? 1 : 0,
      payload.description || null,
      payload.createdBy || null,
      payload.updatedBy || null,
    ],
  );

  return result.insertId;
}

export async function updateAcademicYearRecord(id, payload, connection = db) {
  const fields = [];
  const values = [];
  const fieldMap = {
    name: 'name',
    startDate: 'start_date',
    endDate: 'end_date',
    status: 'status',
    isCurrent: 'is_current',
    description: 'description',
    updatedBy: 'updated_by',
  };

  Object.entries(fieldMap).forEach(([key, column]) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      fields.push(`${column} = ?`);
      values.push(key === 'isCurrent' ? (payload[key] ? 1 : 0) : payload[key] || null);
    }
  });

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const [result] = await connection.execute(
    `UPDATE academic_years SET ${fields.join(', ')} WHERE id = ?`,
    [...values, id],
  );

  return result.affectedRows > 0;
}

export async function clearCurrentAcademicYears(exceptId = null, connection = db) {
  if (exceptId) {
    await connection.execute('UPDATE academic_years SET is_current = 0 WHERE id <> ?', [exceptId]);
    return;
  }

  await connection.execute('UPDATE academic_years SET is_current = 0');
}

export async function setCurrentAcademicYear(id, connection = db) {
  await connection.execute('UPDATE academic_years SET is_current = 1 WHERE id = ?', [id]);
}

export async function deleteAcademicYearRecord(id, connection = db) {
  const [result] = await connection.execute('DELETE FROM academic_years WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function withAcademicYearTransaction(callback) {
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

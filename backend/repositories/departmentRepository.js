import { randomUUID } from 'crypto';
import { db } from '../config/database.js';

let schemaReadyPromise;

export async function ensureDepartmentSchema() {
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS departments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL UNIQUE,
        description TEXT NULL,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_by BIGINT UNSIGNED NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_departments_status_name (status, name)
      )`,
    );

    const [columnRows] = await db.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'department_id'
       LIMIT 1`,
    );

    if (!columnRows.length) {
      await db.execute('ALTER TABLE teachers ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER department');
      await db.execute('CREATE INDEX idx_teachers_department_id ON teachers (department_id)');
    }

    await db.execute(
      `INSERT IGNORE INTO departments (uuid, name, status)
       SELECT UUID(), TRIM(department), 'active'
       FROM teachers
       WHERE department IS NOT NULL AND TRIM(department) <> ''`,
    );
    await db.execute(
      `UPDATE teachers t
       INNER JOIN departments d ON d.name = t.department
       SET t.department_id = d.id
       WHERE t.department_id IS NULL`,
    );
  })();

  return schemaReadyPromise;
}

const mapDepartment = (row) => ({
  id: row.id,
  uuid: row.uuid,
  name: row.name,
  description: row.description || '',
  status: row.status === 'active' ? 'Active' : 'Inactive',
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

function orderBy(sort = 'name', direction = 'asc') {
  const allowed = {
    name: 'name',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  };
  const column = allowed[sort] || allowed.name;
  const normalizedDirection = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `${column} ${normalizedDirection}, id ${normalizedDirection}`;
}

export async function listDepartments({ search = '', status = '', page = 1, limit = 50, sort = 'name', direction = 'asc' } = {}) {
  await ensureDepartmentSchema();
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const filters = [];
  const values = [];

  if (search) {
    filters.push('(name LIKE ? OR description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    filters.push('status = ?');
    values.push(String(status).toLowerCase());
  }

  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await db.query(
    `SELECT id, uuid, name, description, status, created_at AS createdAt, updated_at AS updatedAt
     FROM departments
     ${whereSql}
     ORDER BY ${orderBy(sort, direction)}
     LIMIT ? OFFSET ?`,
    [...values, safeLimit, offset],
  );
  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total FROM departments ${whereSql}`,
    values,
  );

  return {
    departments: rows.map(mapDepartment),
    total: Number(countRow.total || 0),
    page: safePage,
    limit: safeLimit,
  };
}

export async function findDepartmentById(id) {
  await ensureDepartmentSchema();
  const [rows] = await db.execute(
    `SELECT id, uuid, name, description, status, created_at AS createdAt, updated_at AS updatedAt
     FROM departments WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? mapDepartment(rows[0]) : null;
}

export async function findActiveDepartmentById(id) {
  await ensureDepartmentSchema();
  const [rows] = await db.execute(
    'SELECT id, name FROM departments WHERE id = ? AND status = ? LIMIT 1',
    [id, 'active'],
  );
  return rows[0] || null;
}

export async function findActiveDepartmentByName(name) {
  await ensureDepartmentSchema();
  const [rows] = await db.execute(
    'SELECT id, name FROM departments WHERE LOWER(name) = LOWER(?) AND status = ? LIMIT 1',
    [name, 'active'],
  );
  return rows[0] || null;
}

export async function createDepartment({ name, description = '', status = 'active', createdBy = null }) {
  await ensureDepartmentSchema();
  const [result] = await db.execute(
    `INSERT INTO departments (uuid, name, description, status, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [randomUUID(), name, description || null, status, createdBy],
  );
  return findDepartmentById(result.insertId);
}

export async function updateDepartment(id, payload) {
  await ensureDepartmentSchema();
  const allowed = {
    name: 'name',
    description: 'description',
    status: 'status',
  };
  const entries = Object.entries(payload).filter(([key]) => allowed[key]);
  if (!entries.length) return findDepartmentById(id);

  const assignments = entries.map(([key]) => `${allowed[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  const [result] = await db.execute(
    `UPDATE departments SET ${assignments} WHERE id = ?`,
    [...values, id],
  );
  return result.affectedRows ? findDepartmentById(id) : null;
}

export async function deleteDepartment(id) {
  await ensureDepartmentSchema();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      'UPDATE teachers SET department_id = NULL, department = NULL WHERE department_id = ?',
      [id],
    );
    const [result] = await connection.execute('DELETE FROM departments WHERE id = ?', [id]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

import { randomUUID } from 'crypto';
import { db } from '../config/database.js';

const mapAdminRow = (row) => ({
  id: row.adminId,
  userId: row.userId,
  fullName: row.fullName,
  username: row.username,
  email: row.email,
  phone: row.phone || '',
  department: row.department || '',
  status: row.status === 'active' ? 'Active' : 'Inactive',
  createdDate: row.createdDate,
  photo: row.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
});

export async function listAdmins({ search = '', status = '' } = {}) {
  const filters = [`u.role = 'admin'`];
  const params = [];

  if (search) {
    filters.push(`(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR a.department LIKE ?)`);
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  if (status && status !== 'All') {
    filters.push(`u.status = ?`);
    params.push(status.toLowerCase());
  }

  const [rows] = await db.query(
    `SELECT
       a.id AS adminId,
       u.id AS userId,
       u.full_name AS fullName,
       u.username,
       u.email,
       u.phone,
       u.status,
       a.department,
       DATE_FORMAT(a.created_at, '%Y-%m-%d') AS createdDate
     FROM admins a
     INNER JOIN users u ON u.id = a.user_id
     WHERE ${filters.join(' AND ')}
     ORDER BY a.created_at DESC`,
    params,
  );

  return rows.map(mapAdminRow);
}

export async function findAdminById(id) {
  const [rows] = await db.query(
    `SELECT
       a.id AS adminId,
       u.id AS userId,
       u.full_name AS fullName,
       u.username,
       u.email,
       u.phone,
       u.status,
       a.department,
       DATE_FORMAT(a.created_at, '%Y-%m-%d') AS createdDate
     FROM admins a
     INNER JOIN users u ON u.id = a.user_id
     WHERE a.id = ? AND u.role = 'admin'
     LIMIT 1`,
    [id],
  );

  return rows[0] ? mapAdminRow(rows[0]) : null;
}

export async function createAdminRecord(payload) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [userResult] = await connection.query(
      `INSERT INTO users (uuid, full_name, username, email, password_hash, role, status, phone, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', ?, ?, ?)`,
      [
        randomUUID(),
        payload.fullName,
        payload.username,
        payload.email,
        payload.passwordHash,
        payload.status,
        payload.phone || null,
        payload.status === 'active' ? 1 : 0,
      ],
    );

    const [adminResult] = await connection.query(
      `INSERT INTO admins (user_id, department) VALUES (?, ?)`,
      [userResult.insertId, payload.department || null],
    );

    await connection.commit();
    return findAdminById(adminResult.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateAdminRecord(id, payload) {
  const existing = await findAdminById(id);
  if (!existing) {
    return null;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE users
       SET full_name = ?, username = ?, email = ?, phone = ?, status = ?, is_active = ?
       WHERE id = ? AND role = 'admin'`,
      [
        payload.fullName,
        payload.username,
        payload.email,
        payload.phone || null,
        payload.status,
        payload.status === 'active' ? 1 : 0,
        existing.userId,
      ],
    );
    await connection.query(`UPDATE admins SET department = ? WHERE id = ?`, [
      payload.department || null,
      id,
    ]);
    await connection.commit();
    return findAdminById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteAdminRecord(id) {
  const existing = await findAdminById(id);
  if (!existing) {
    return false;
  }

  const [result] = await db.query(`DELETE FROM users WHERE id = ? AND role = 'admin'`, [
    existing.userId,
  ]);
  return result.affectedRows > 0;
}

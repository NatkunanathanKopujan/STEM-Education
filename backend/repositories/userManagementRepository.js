import { randomUUID } from 'crypto';
import { db } from '../config/database.js';

const roleConfig = {
  admin: {
    table: 'admins',
    profileIdColumn: 'employee_no',
    extraColumn: 'department',
    idAlias: 'adminId',
  },
  teacher: {
    table: 'teachers',
    profileIdColumn: 'employee_no',
    extraColumn: 'specialization',
    idAlias: 'teacherId',
  },
  student: {
    table: 'students',
    profileIdColumn: 'student_no',
    extraColumn: 'program',
    idAlias: 'studentId',
  },
};

const initials = (fullName = '') =>
  fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const statusToUi = (status) => (status === 'active' ? 'Active' : 'Inactive');

function mapRow(role, row) {
  const base = {
    id: row.profileId,
    userId: row.userId,
    fullName: row.fullName,
    username: row.username,
    email: row.email,
    phone: row.phone || '',
    status: statusToUi(row.status),
    createdDate: row.createdDate,
    photo: initials(row.fullName),
  };

  if (role === 'admin') {
    return { ...base, department: row.department || '' };
  }

  if (role === 'teacher') {
    return {
      ...base,
      department: row.department || '',
      qualification: row.specialization || '',
    };
  }

  return {
    ...base,
    studentId: row.profileCode || '',
    batch: row.enrollmentYear ? String(row.enrollmentYear) : '',
    curriculum: row.program || '',
  };
}

function getConfig(role) {
  const config = roleConfig[role];
  if (!config) {
    throw new Error(`Unsupported managed user role: ${role}`);
  }
  return config;
}

export async function listManagedUsers(role, { search = '', status = '' } = {}) {
  const config = getConfig(role);
  const filters = [`u.role = ?`];
  const params = [role];

  if (search) {
    filters.push(
      `(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.${config.profileIdColumn} LIKE ? OR p.${config.extraColumn} LIKE ?)`,
    );
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  if (status && status !== 'All') {
    filters.push(`u.status = ?`);
    params.push(status.toLowerCase());
  }

  const selectExtra =
    role === 'student'
      ? `p.student_no AS profileCode, p.enrollment_year AS enrollmentYear, p.program`
      : role === 'teacher'
        ? `p.employee_no AS profileCode, p.department, p.specialization`
        : `p.employee_no AS profileCode, p.department`;

  const [rows] = await db.query(
    `SELECT
       p.id AS profileId,
       u.id AS userId,
       u.full_name AS fullName,
       u.username,
       u.email,
       u.phone,
       u.status,
       DATE_FORMAT(p.created_at, '%Y-%m-%d') AS createdDate,
       ${selectExtra}
     FROM ${config.table} p
     INNER JOIN users u ON u.id = p.user_id
     WHERE ${filters.join(' AND ')}
     ORDER BY p.created_at DESC`,
    params,
  );

  return rows.map((row) => mapRow(role, row));
}

export async function findManagedUserById(role, id) {
  const config = getConfig(role);
  const selectExtra =
    role === 'student'
      ? `p.student_no AS profileCode, p.enrollment_year AS enrollmentYear, p.program`
      : role === 'teacher'
        ? `p.employee_no AS profileCode, p.department, p.specialization`
        : `p.employee_no AS profileCode, p.department`;

  const [rows] = await db.query(
    `SELECT
       p.id AS profileId,
       u.id AS userId,
       u.full_name AS fullName,
       u.username,
       u.email,
       u.phone,
       u.status,
       DATE_FORMAT(p.created_at, '%Y-%m-%d') AS createdDate,
       ${selectExtra}
     FROM ${config.table} p
     INNER JOIN users u ON u.id = p.user_id
     WHERE p.id = ? AND u.role = ?
     LIMIT 1`,
    [id, role],
  );

  return rows[0] ? mapRow(role, rows[0]) : null;
}

export async function createManagedUser(role, payload) {
  const config = getConfig(role);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [userResult] = await connection.query(
      `INSERT INTO users (uuid, full_name, username, email, password_hash, role, status, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        payload.fullName,
        payload.username,
        payload.email,
        payload.passwordHash,
        role,
        payload.status,
        payload.phone || null,
        payload.status === 'active' ? 1 : 0,
      ],
    );

    if (role === 'student') {
      const [profileResult] = await connection.query(
        `INSERT INTO students (user_id, student_no, enrollment_year, program) VALUES (?, ?, ?, ?)`,
        [userResult.insertId, payload.studentId || null, payload.batch || null, payload.curriculum || null],
      );
      await connection.commit();
      return findManagedUserById(role, profileResult.insertId);
    }

    const [profileResult] =
      role === 'teacher'
        ? await connection.query(
            `INSERT INTO teachers (user_id, employee_no, department, specialization) VALUES (?, ?, ?, ?)`,
            [
              userResult.insertId,
              payload.employeeNo || null,
              payload.department || null,
              payload.qualification || null,
            ],
          )
        : await connection.query(
            `INSERT INTO ${config.table} (user_id, employee_no, department) VALUES (?, ?, ?)`,
            [userResult.insertId, payload.employeeNo || null, payload.department || null],
          );

    await connection.commit();
    return findManagedUserById(role, profileResult.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateManagedUser(role, id, payload) {
  const existing = await findManagedUserById(role, id);
  if (!existing) {
    return null;
  }

  const config = getConfig(role);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE users
       SET full_name = ?, username = ?, email = ?, phone = ?, status = ?, is_active = ?
       ${payload.passwordHash ? ', password_hash = ?' : ''}
       WHERE id = ? AND role = ?`,
      [
        payload.fullName,
        payload.username,
        payload.email,
        payload.phone || null,
        payload.status,
        payload.status === 'active' ? 1 : 0,
        ...(payload.passwordHash ? [payload.passwordHash] : []),
        existing.userId,
        role,
      ],
    );

    if (role === 'student') {
      await connection.query(
        `UPDATE students SET student_no = ?, enrollment_year = ?, program = ? WHERE id = ?`,
        [payload.studentId || null, payload.batch || null, payload.curriculum || null, id],
      );
    } else if (role === 'teacher') {
      await connection.query(
        `UPDATE teachers SET department = ?, specialization = ? WHERE id = ?`,
        [payload.department || null, payload.qualification || null, id],
      );
    } else {
      await connection.query(`UPDATE ${config.table} SET department = ? WHERE id = ?`, [
        payload.department || null,
        id,
      ]);
    }

    await connection.commit();
    return findManagedUserById(role, id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteManagedUser(role, id) {
  const existing = await findManagedUserById(role, id);
  if (!existing) {
    return false;
  }

  const [result] = await db.query(`DELETE FROM users WHERE id = ? AND role = ?`, [
    existing.userId,
    role,
  ]);
  return result.affectedRows > 0;
}

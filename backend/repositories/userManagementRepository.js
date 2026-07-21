import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { ensureStudentCurriculumSchema } from './curriculumRepository.js';
import { ensureDepartmentSchema } from './departmentRepository.js';

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
      employeeNo: row.profileCode || '',
      departmentId: row.departmentId || null,
      department: row.departmentName || row.department || '',
      qualification: row.specialization || '',
    };
  }

  return {
    ...base,
    studentId: row.profileCode || '',
    batch: row.enrollmentYear ? String(row.enrollmentYear) : '',
    curriculumId: row.curriculumId || null,
    curriculum: row.curriculumName || row.program || '',
  };
}

function getConfig(role) {
  const config = roleConfig[role];
  if (!config) {
    throw new Error(`Unsupported managed user role: ${role}`);
  }
  return config;
}

function getSortClause(role, sort = 'createdDate', direction = 'desc') {
  const sortColumns = {
    createdDate: 'p.created_at',
    fullName: 'u.full_name',
    username: 'u.username',
    email: 'u.email',
    status: 'u.status',
    code: role === 'student' ? 'p.student_no' : 'p.employee_no',
  };
  const column = sortColumns[sort] || sortColumns.createdDate;
  const normalizedDirection = String(direction).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  return `${column} ${normalizedDirection}, p.id ${normalizedDirection}`;
}

export async function listManagedUsers(
  role,
  { search = '', status = '', page = 1, limit = 10, sort = 'createdDate', direction = 'desc' } = {},
) {
  if (role === 'teacher') {
    await ensureDepartmentSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
  }
  const config = getConfig(role);
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const orderBy = getSortClause(role, sort, direction);
  const filters = [`u.role = ?`];
  const params = [role];

  if (search) {
    filters.push(role === 'teacher'
      ? `(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.${config.profileIdColumn} LIKE ? OR p.${config.extraColumn} LIKE ? OR d.name LIKE ? OR p.department LIKE ?)`
      : role === 'student'
        ? `(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.${config.profileIdColumn} LIKE ? OR p.${config.extraColumn} LIKE ? OR c.title LIKE ?)`
        : `(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.${config.profileIdColumn} LIKE ? OR p.${config.extraColumn} LIKE ?)`);
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
    if (role === 'teacher') {
      params.push(term, term);
    } else if (role === 'student') {
      params.push(term);
    }
  }

  if (status && status !== 'All') {
    filters.push(`u.status = ?`);
    params.push(status.toLowerCase());
  }

  const selectExtra =
    role === 'student'
      ? `p.student_no AS profileCode, p.enrollment_year AS enrollmentYear, p.program,
        p.curriculum_id AS curriculumId, c.title AS curriculumName`
      : role === 'teacher'
        ? `p.employee_no AS profileCode, p.department_id AS departmentId, p.department, d.name AS departmentName, p.specialization`
        : `p.employee_no AS profileCode, p.department`;

  const baseFrom = `FROM ${config.table} p
     INNER JOIN users u ON u.id = p.user_id
     ${role === 'teacher' ? 'LEFT JOIN departments d ON d.id = p.department_id' : ''}
     ${role === 'student' ? 'LEFT JOIN curriculums c ON c.id = p.curriculum_id' : ''}
     WHERE ${filters.join(' AND ')}`;

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
     ${baseFrom}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset],
  );

  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total ${baseFrom}`,
    params,
  );

  return {
    users: rows.map((row) => mapRow(role, row)),
    total: Number(countRow.total || 0),
    page: safePage,
    limit: safeLimit,
  };
}

export async function findManagedUserById(role, id) {
  if (role === 'teacher') {
    await ensureDepartmentSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
  }
  const config = getConfig(role);
  const selectExtra =
    role === 'student'
      ? `p.student_no AS profileCode, p.enrollment_year AS enrollmentYear, p.program,
        p.curriculum_id AS curriculumId, c.title AS curriculumName`
      : role === 'teacher'
        ? `p.employee_no AS profileCode, p.department_id AS departmentId, p.department, d.name AS departmentName, p.specialization`
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
     ${role === 'teacher' ? 'LEFT JOIN departments d ON d.id = p.department_id' : ''}
     ${role === 'student' ? 'LEFT JOIN curriculums c ON c.id = p.curriculum_id' : ''}
     WHERE p.id = ? AND u.role = ?
     LIMIT 1`,
    [id, role],
  );

  return rows[0] ? mapRow(role, rows[0]) : null;
}

export async function createManagedUser(role, payload) {
  if (role === 'teacher') {
    await ensureDepartmentSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
  }
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
        `INSERT INTO students (user_id, student_no, enrollment_year, program, curriculum_id) VALUES (?, ?, ?, ?, ?)`,
        [
          userResult.insertId,
          payload.studentId || null,
          payload.batch || null,
          payload.curriculum || null,
          payload.curriculumId || null,
        ],
      );
      await connection.commit();
      return findManagedUserById(role, profileResult.insertId);
    }

    const [profileResult] =
      role === 'teacher'
        ? await connection.query(
            `INSERT INTO teachers (user_id, employee_no, department, department_id, specialization) VALUES (?, ?, ?, ?, ?)`,
            [
              userResult.insertId,
              payload.employeeNo || null,
              payload.department || null,
              payload.departmentId || null,
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
  if (role === 'teacher') {
    await ensureDepartmentSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
  }
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
        `UPDATE students SET student_no = ?, enrollment_year = ?, program = ?, curriculum_id = ? WHERE id = ?`,
        [
          payload.studentId || null,
          payload.batch || null,
          payload.curriculum || null,
          payload.curriculumId || null,
          id,
        ],
      );
    } else if (role === 'teacher') {
      await connection.query(
        `UPDATE teachers SET employee_no = ?, department = ?, department_id = ?, specialization = ? WHERE id = ?`,
        [
          payload.employeeNo || null,
          payload.department || null,
          payload.departmentId || null,
          payload.qualification || null,
          id,
        ],
      );
    } else {
      await connection.query(`UPDATE ${config.table} SET employee_no = ?, department = ? WHERE id = ?`, [
        payload.employeeNo || null,
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

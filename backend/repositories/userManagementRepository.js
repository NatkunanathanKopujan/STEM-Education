import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { ensureCurriculumManagementSchema, ensureStudentCurriculumSchema } from './curriculumRepository.js';
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

let studentDepartmentSchemaReady = false;
let userAssignmentSchemaReady = false;
let adminScopeSchemaReady = false;

const parseJsonArray = (value) => {
  if (!value) return [];
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
};

export async function ensureStudentDepartmentSchema() {
  if (studentDepartmentSchemaReady) return;

  const [columns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      AND COLUMN_NAME = 'department_id'`,
  );

  if (!columns.length) {
    await db.query('ALTER TABLE students ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER curriculum_id');
  }

  const [indexes] = await db.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      AND INDEX_NAME = 'idx_students_department_id'`,
  );

  if (!indexes.length) {
    await db.query('CREATE INDEX idx_students_department_id ON students (department_id)');
  }

  studentDepartmentSchemaReady = true;
}

export async function ensureUserAssignmentSchema() {
  await ensureDepartmentSchema();
  await ensureCurriculumManagementSchema();
  await ensureStudentDepartmentSchema();
  if (userAssignmentSchemaReady) return;

  await db.query(
    `CREATE TABLE IF NOT EXISTS teacher_departments (
      teacher_id BIGINT UNSIGNED NOT NULL,
      department_id BIGINT UNSIGNED NOT NULL,
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (teacher_id, department_id),
      CONSTRAINT fk_teacher_departments_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      CONSTRAINT fk_teacher_departments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      INDEX idx_teacher_departments_department (department_id)
    )`,
  );

  await db.query(
    `CREATE TABLE IF NOT EXISTS student_departments (
      student_id BIGINT UNSIGNED NOT NULL,
      department_id BIGINT UNSIGNED NOT NULL,
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_id, department_id),
      CONSTRAINT fk_student_departments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      CONSTRAINT fk_student_departments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      INDEX idx_student_departments_department (department_id)
    )`,
  );

  await db.query(
    `INSERT IGNORE INTO teacher_departments (teacher_id, department_id)
     SELECT id, department_id FROM teachers WHERE department_id IS NOT NULL`,
  );
  await db.query(
    `INSERT IGNORE INTO student_departments (student_id, department_id)
     SELECT id, department_id FROM students WHERE department_id IS NOT NULL`,
  );

  userAssignmentSchemaReady = true;
}

export async function ensureAdminScopeSchema() {
  if (adminScopeSchemaReady) return;

  const tables = ['teachers', 'students'];
  for (const table of tables) {
    const [columns] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = 'managed_by_admin_id'`,
      [table],
    );
    if (!columns.length) {
      await db.query(`ALTER TABLE ${table} ADD COLUMN managed_by_admin_id BIGINT UNSIGNED NULL AFTER user_id`);
    }

    const [indexes] = await db.query(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?`,
      [table, `idx_${table}_managed_by_admin_id`],
    );
    if (!indexes.length) {
      await db.query(`CREATE INDEX idx_${table}_managed_by_admin_id ON ${table} (managed_by_admin_id)`);
    }
  }

  adminScopeSchemaReady = true;
}

export async function findTeacherDepartmentsByUserId(userId) {
  await ensureUserAssignmentSchema();
  const [rows] = await db.query(
    `SELECT d.id AS departmentId, d.name AS department
     FROM teachers t
     INNER JOIN teacher_departments td ON td.teacher_id = t.id
     INNER JOIN departments d ON d.id = td.department_id
     WHERE t.user_id = ? AND d.status = 'active'
     ORDER BY d.name`,
    [userId],
  );
  return rows;
}

export async function findTeacherCurriculumsByUserId(userId) {
  await ensureUserAssignmentSchema();
  const [rows] = await db.query(
    `SELECT c.id AS curriculumId, c.title AS curriculum, c.department_id AS departmentId
     FROM teachers t
     INNER JOIN curriculum_teachers ct ON ct.teacher_id = t.id
     INNER JOIN curriculums c ON c.id = ct.curriculum_id
     WHERE t.user_id = ?
       AND c.is_active = 1
     ORDER BY c.title`,
    [userId],
  );
  return rows;
}

export async function findTeacherAdminOwnerByUserId(userId) {
  await ensureAdminScopeSchema();
  const [rows] = await db.query(
    `SELECT managed_by_admin_id AS managedByAdminId
     FROM teachers
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0]?.managedByAdminId || null;
}

function mapRow(role, row) {
  const base = {
    id: row.profileId,
    userId: row.userId,
    managedByAdminId: row.managedByAdminId || null,
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
    const departments = parseJsonArray(row.departmentsJson);
    const curriculums = parseJsonArray(row.curriculumsJson);
    return {
      ...base,
      employeeNo: row.profileCode || '',
      departmentId: departments[0]?.id || row.departmentId || null,
      departmentIds: departments.map((department) => department.id),
      departments,
      department: departments.map((department) => department.name).join(', ') || row.departmentName || row.department || '',
      curriculumIds: curriculums.map((curriculum) => curriculum.id),
      curriculums,
      curriculum: curriculums.map((curriculum) => curriculum.name).join(', '),
      qualification: row.specialization || '',
    };
  }

  const departments = parseJsonArray(row.departmentsJson);
  return {
    ...base,
    studentId: row.profileCode || '',
    batch: row.enrollmentYear ? String(row.enrollmentYear) : '',
    departmentId: departments[0]?.id || row.departmentId || null,
    departmentIds: departments.map((department) => department.id),
    departments,
    department: departments.map((department) => department.name).join(', ') || row.departmentName || '',
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
  {
    search = '',
    status = '',
    page = 1,
    limit = 10,
    sort = 'createdDate',
    direction = 'desc',
    departmentId = '',
    departmentIds = [],
    managedByAdminId = '',
  } = {},
) {
  if (role === 'teacher') {
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
  }
  const config = getConfig(role);
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const orderBy = getSortClause(role, sort, direction);
  const whereFilters = [`u.role = ?`];
  const params = [role];

  if (search) {
    whereFilters.push(role === 'teacher'
      ? `(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.${config.profileIdColumn} LIKE ? OR p.${config.extraColumn} LIKE ? OR EXISTS (SELECT 1 FROM teacher_departments std INNER JOIN departments sd ON sd.id = std.department_id WHERE std.teacher_id = p.id AND sd.name LIKE ?) OR p.department LIKE ? OR EXISTS (SELECT 1 FROM curriculum_teachers sct INNER JOIN curriculums sc ON sc.id = sct.curriculum_id WHERE sct.teacher_id = p.id AND sc.title LIKE ?))`
      : role === 'student'
        ? `(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.${config.profileIdColumn} LIKE ? OR p.${config.extraColumn} LIKE ? OR c.title LIKE ? OR EXISTS (SELECT 1 FROM student_departments ssd INNER JOIN departments sd ON sd.id = ssd.department_id WHERE ssd.student_id = p.id AND sd.name LIKE ?))`
        : `(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.${config.profileIdColumn} LIKE ? OR p.${config.extraColumn} LIKE ?)`);
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
    if (role === 'teacher') {
      params.push(term, term, term);
    } else if (role === 'student') {
      params.push(term, term);
    }
  }

  const filterDepartmentIds = [...new Set([...(departmentIds || []), departmentId].map(Number).filter(Boolean))];
  if (role === 'student' && filterDepartmentIds.length) {
    whereFilters.push(`EXISTS (SELECT 1 FROM student_departments filter_sd WHERE filter_sd.student_id = p.id AND filter_sd.department_id IN (${filterDepartmentIds.map(() => '?').join(',')}))`);
    params.push(...filterDepartmentIds);
  }

  if ((role === 'teacher' || role === 'student') && managedByAdminId) {
    whereFilters.push('p.managed_by_admin_id = ?');
    params.push(Number(managedByAdminId));
  }

  if (status && status !== 'All') {
    whereFilters.push(`u.status = ?`);
    params.push(status.toLowerCase());
  }

  const selectExtra =
    role === 'student'
      ? `p.managed_by_admin_id AS managedByAdminId,
        p.student_no AS profileCode, p.enrollment_year AS enrollmentYear, p.program,
        p.curriculum_id AS curriculumId, c.title AS curriculumName,
        p.department_id AS departmentId, d.name AS departmentName,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', sd.id, 'name', sd.name))
         FROM student_departments ssd
         INNER JOIN departments sd ON sd.id = ssd.department_id
         WHERE ssd.student_id = p.id) AS departmentsJson`
      : role === 'teacher'
        ? `p.managed_by_admin_id AS managedByAdminId,
        p.employee_no AS profileCode, p.department_id AS departmentId, p.department, d.name AS departmentName, p.specialization,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', sd.id, 'name', sd.name))
         FROM teacher_departments std
         INNER JOIN departments sd ON sd.id = std.department_id
         WHERE std.teacher_id = p.id) AS departmentsJson,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', sc.id, 'name', sc.title))
         FROM curriculum_teachers sct
         INNER JOIN curriculums sc ON sc.id = sct.curriculum_id
         WHERE sct.teacher_id = p.id) AS curriculumsJson`
        : `p.employee_no AS profileCode, p.department`;

  const baseFrom = `FROM ${config.table} p
     INNER JOIN users u ON u.id = p.user_id
     ${role === 'teacher' ? 'LEFT JOIN departments d ON d.id = p.department_id' : ''}
     ${role === 'student' ? 'LEFT JOIN curriculums c ON c.id = p.curriculum_id LEFT JOIN departments d ON d.id = p.department_id' : ''}
     WHERE ${whereFilters.join(' AND ')}`;

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
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
  }
  const config = getConfig(role);
  const selectExtra =
    role === 'student'
      ? `p.managed_by_admin_id AS managedByAdminId,
        p.student_no AS profileCode, p.enrollment_year AS enrollmentYear, p.program,
        p.curriculum_id AS curriculumId, c.title AS curriculumName,
        p.department_id AS departmentId, d.name AS departmentName,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', sd.id, 'name', sd.name))
         FROM student_departments ssd
         INNER JOIN departments sd ON sd.id = ssd.department_id
         WHERE ssd.student_id = p.id) AS departmentsJson`
      : role === 'teacher'
        ? `p.managed_by_admin_id AS managedByAdminId,
        p.employee_no AS profileCode, p.department_id AS departmentId, p.department, d.name AS departmentName, p.specialization,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', sd.id, 'name', sd.name))
         FROM teacher_departments std
         INNER JOIN departments sd ON sd.id = std.department_id
         WHERE std.teacher_id = p.id) AS departmentsJson,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', sc.id, 'name', sc.title))
         FROM curriculum_teachers sct
         INNER JOIN curriculums sc ON sc.id = sct.curriculum_id
         WHERE sct.teacher_id = p.id) AS curriculumsJson`
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
     ${role === 'student' ? 'LEFT JOIN curriculums c ON c.id = p.curriculum_id LEFT JOIN departments d ON d.id = p.department_id' : ''}
     WHERE p.id = ? AND u.role = ?
     LIMIT 1`,
    [id, role],
  );

  return rows[0] ? mapRow(role, rows[0]) : null;
}

async function syncProfileDepartments(connection, role, profileId, departmentIds = []) {
  const table = role === 'teacher' ? 'teacher_departments' : 'student_departments';
  const profileColumn = role === 'teacher' ? 'teacher_id' : 'student_id';
  const uniqueIds = [...new Set((departmentIds || []).map(Number).filter(Boolean))];

  await connection.query(`DELETE FROM ${table} WHERE ${profileColumn} = ?`, [profileId]);
  if (!uniqueIds.length) return;

  const [departments] = await connection.query(
    `SELECT id FROM departments WHERE id IN (${uniqueIds.map(() => '?').join(',')}) AND status = 'active'`,
    uniqueIds,
  );
  const validIds = departments.map((department) => department.id);
  if (!validIds.length) return;

  await connection.query(
    `INSERT INTO ${table} (${profileColumn}, department_id) VALUES ${validIds.map(() => '(?, ?)').join(', ')}`,
    validIds.flatMap((departmentId) => [profileId, departmentId]),
  );
}

async function syncTeacherCurriculums(connection, teacherId, curriculumIds = []) {
  const uniqueIds = [...new Set((curriculumIds || []).map(Number).filter(Boolean))];
  await connection.query('DELETE FROM curriculum_teachers WHERE teacher_id = ?', [teacherId]);

  if (!uniqueIds.length) return;

  const [curriculums] = await connection.query(
    `SELECT id FROM curriculums WHERE id IN (${uniqueIds.map(() => '?').join(',')}) AND is_active = 1`,
    uniqueIds,
  );
  const validIds = curriculums.map((curriculum) => curriculum.id);
  if (!validIds.length) return;

  await connection.query(
    `INSERT INTO curriculum_teachers (curriculum_id, teacher_id) VALUES ${validIds.map(() => '(?, ?)').join(', ')}`,
    validIds.flatMap((curriculumId) => [curriculumId, teacherId]),
  );
}

export async function createManagedUser(role, payload) {
  if (role === 'teacher') {
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
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
        `INSERT INTO students (user_id, managed_by_admin_id, student_no, enrollment_year, program, curriculum_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userResult.insertId,
          payload.managedByAdminId || null,
          payload.studentId || null,
          payload.batch || null,
          payload.curriculum || null,
          payload.curriculumId || null,
          payload.departmentId || null,
        ],
      );
      await syncProfileDepartments(connection, 'student', profileResult.insertId, payload.departmentIds);
      await connection.commit();
      return findManagedUserById(role, profileResult.insertId);
    }

    const [profileResult] =
      role === 'teacher'
        ? await connection.query(
            `INSERT INTO teachers (user_id, managed_by_admin_id, employee_no, department, department_id, specialization) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userResult.insertId,
              payload.managedByAdminId || null,
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

    if (role === 'teacher') {
      await syncProfileDepartments(connection, 'teacher', profileResult.insertId, payload.departmentIds);
      await syncTeacherCurriculums(connection, profileResult.insertId, payload.curriculumIds);
    }
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
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
  } else if (role === 'student') {
    await ensureStudentCurriculumSchema();
    await ensureUserAssignmentSchema();
    await ensureAdminScopeSchema();
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
        `UPDATE students SET student_no = ?, enrollment_year = ?, program = ?, curriculum_id = ?, department_id = ?, managed_by_admin_id = ? WHERE id = ?`,
        [
          payload.studentId || null,
          payload.batch || null,
          payload.curriculum || null,
          payload.curriculumId || null,
          payload.departmentId || null,
          payload.managedByAdminId || null,
          id,
        ],
      );
    } else if (role === 'teacher') {
      await connection.query(
        `UPDATE teachers SET employee_no = ?, department = ?, department_id = ?, specialization = ?, managed_by_admin_id = ? WHERE id = ?`,
        [
          payload.employeeNo || null,
          payload.department || null,
          payload.departmentId || null,
          payload.qualification || null,
          payload.managedByAdminId || null,
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

    if (role === 'teacher' || role === 'student') {
      await syncProfileDepartments(connection, role, id, payload.departmentIds);
    }
    if (role === 'teacher') {
      await syncTeacherCurriculums(connection, id, payload.curriculumIds);
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

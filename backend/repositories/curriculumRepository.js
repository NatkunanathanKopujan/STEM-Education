import { randomUUID } from 'crypto';
import { db } from '../config/database.js';

const parseTeachers = (value) => {
  if (!value) return [];
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  const uniqueTeachers = new Map();
  parsed.filter(Boolean).forEach((teacher) => {
    if (teacher?.id) uniqueTeachers.set(Number(teacher.id), teacher);
  });
  return Array.from(uniqueTeachers.values());
};

const mapCurriculum = (row) => ({
  id: row.id,
  name: row.title,
  code: row.code,
  description: row.description || '',
  duration: row.duration || '',
  academicYear: row.academicYear || '',
  departmentId: row.departmentId || '',
  departmentName: row.departmentName || '',
  createdBy: row.createdBy || null,
  teachers: parseTeachers(row.teachersJson),
  students: Number(row.students || 0),
  subjects: Number(row.subjects || 0),
  materials: Number(row.materials || 0),
  status: row.isActive ? 'Active' : 'Archived',
  createdDate: row.createdDate,
});

let studentCurriculumSchemaReady = false;
let curriculumManagementSchemaReady = false;
let curriculumFileCourseSchemaReady = false;

async function ensureCurriculumFileCourseSchema() {
  if (curriculumFileCourseSchemaReady) return;

  const [columns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'files'
      AND COLUMN_NAME = 'course_id'`,
  );

  if (!columns.length) {
    await db.query('ALTER TABLE files ADD COLUMN course_id BIGINT UNSIGNED NULL AFTER subject');
    await db.query('CREATE INDEX idx_files_course_id ON files (course_id)');
  }

  curriculumFileCourseSchemaReady = true;
}

export async function ensureCurriculumManagementSchema() {
  if (curriculumManagementSchemaReady) return;

  const [durationColumns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'curriculums'
      AND COLUMN_NAME = 'duration'`,
  );
  if (!durationColumns.length) {
    await db.query('ALTER TABLE curriculums ADD COLUMN duration VARCHAR(120) NULL AFTER description');
  }

  const [academicYearColumns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'curriculums'
      AND COLUMN_NAME = 'academic_year'`,
  );
  if (!academicYearColumns.length) {
    await db.query('ALTER TABLE curriculums ADD COLUMN academic_year VARCHAR(120) NULL AFTER duration');
  }

  const [departmentColumns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'curriculums'
      AND COLUMN_NAME = 'department_id'`,
  );
  if (!departmentColumns.length) {
    await db.query('ALTER TABLE curriculums ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER academic_year');
  }

  const [departmentIndexes] = await db.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'curriculums'
      AND INDEX_NAME = 'idx_curriculums_department_id'`,
  );
  if (!departmentIndexes.length) {
    await db.query('CREATE INDEX idx_curriculums_department_id ON curriculums (department_id)');
  }

  await db.query(
    `CREATE TABLE IF NOT EXISTS curriculum_teachers (
      curriculum_id BIGINT UNSIGNED NOT NULL,
      teacher_id BIGINT UNSIGNED NOT NULL,
      assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (curriculum_id, teacher_id),
      CONSTRAINT fk_curriculum_teachers_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE CASCADE,
      CONSTRAINT fk_curriculum_teachers_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )`,
  );

  curriculumManagementSchemaReady = true;
}

export async function ensureStudentCurriculumSchema() {
  if (studentCurriculumSchemaReady) return;

  const [columns] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      AND COLUMN_NAME = 'curriculum_id'`,
  );

  if (!columns.length) {
    await db.query('ALTER TABLE students ADD COLUMN curriculum_id BIGINT UNSIGNED NULL AFTER program');
    await db.query('CREATE INDEX idx_students_curriculum_id ON students (curriculum_id)');
  }

  await db.query(
    `UPDATE students s
     INNER JOIN curriculums c ON c.title = s.program
     SET s.curriculum_id = c.id
     WHERE s.curriculum_id IS NULL
      AND s.program IS NOT NULL
      AND s.program <> ''`,
  );

  studentCurriculumSchemaReady = true;
}

export async function findActiveCurriculumById(id) {
  await ensureStudentCurriculumSchema();
  const [rows] = await db.query(
    'SELECT id, title AS name FROM curriculums WHERE id = ? AND is_active = 1 LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

export async function findActiveCurriculumByName(name) {
  await ensureStudentCurriculumSchema();
  const [rows] = await db.query(
    'SELECT id, title AS name FROM curriculums WHERE LOWER(title) = LOWER(?) AND is_active = 1 LIMIT 1',
    [name],
  );
  return rows[0] || null;
}

function getSortClause(sort = 'createdDate', direction = 'desc') {
  const sortColumns = {
    createdDate: 'c.created_at',
    name: 'c.title',
    code: 'c.code',
    status: 'c.is_active',
  };
  const column = sortColumns[sort] || sortColumns.createdDate;
  const normalizedDirection = String(direction).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  return `${column} ${normalizedDirection}, c.id ${normalizedDirection}`;
}

export async function listCurriculums({ search = '', status = '', page = 1, limit = 10, sort = 'createdDate', direction = 'desc', createdBy = '' } = {}) {
  await ensureCurriculumManagementSchema();
  await ensureStudentCurriculumSchema();
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const orderBy = getSortClause(sort, direction);
  const filters = [];
  const params = [];

  if (search) {
    filters.push('(c.title LIKE ? OR c.code LIKE ? OR c.description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (status && status !== 'All') {
    filters.push('c.is_active = ?');
    params.push(status === 'Active' ? 1 : 0);
  }

  if (createdBy) {
    filters.push('c.created_by = ?');
    params.push(Number(createdBy));
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const fromClause = `FROM curriculums c
     LEFT JOIN departments d ON d.id = c.department_id
     LEFT JOIN students s ON s.curriculum_id = c.id OR (s.curriculum_id IS NULL AND s.program = c.title)
     LEFT JOIN courses co ON co.curriculum_id = c.id
     LEFT JOIN materials m ON m.course_id = co.id
     ${where}`;

  const [rows] = await db.query(
    `SELECT
       c.id,
       c.title,
       c.code,
       c.description,
       c.duration,
       c.academic_year AS academicYear,
       c.department_id AS departmentId,
       d.name AS departmentName,
       c.created_by AS createdBy,
       c.is_active AS isActive,
       DATE_FORMAT(c.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT s.id) AS students,
       COUNT(DISTINCT co.id) AS subjects,
       COUNT(DISTINCT m.id) AS materials,
       COALESCE(
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'fullName', u.full_name, 'username', u.username, 'employeeNo', t.employee_no))
          FROM curriculum_teachers ct
          INNER JOIN teachers t ON t.id = ct.teacher_id
          INNER JOIN users u ON u.id = t.user_id
          WHERE ct.curriculum_id = c.id
        ),
        JSON_ARRAY()
       ) AS teachersJson
     ${fromClause}
     GROUP BY c.id, c.title, c.code, c.description, c.duration, c.academic_year, c.department_id, d.name, c.created_by, c.is_active, c.created_at
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset],
  );

  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total FROM curriculums c ${where}`,
    params,
  );

  return {
    curriculums: rows.map(mapCurriculum),
    total: Number(countRow.total || 0),
    page: safePage,
    limit: safeLimit,
  };
}

export async function findCurriculumById(id) {
  await ensureCurriculumManagementSchema();
  await ensureStudentCurriculumSchema();
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.title,
       c.code,
       c.description,
       c.duration,
       c.academic_year AS academicYear,
       c.department_id AS departmentId,
       d.name AS departmentName,
       c.created_by AS createdBy,
       c.is_active AS isActive,
       DATE_FORMAT(c.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT s.id) AS students,
       COUNT(DISTINCT co.id) AS subjects,
       COUNT(DISTINCT m.id) AS materials,
       COALESCE(
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'fullName', u.full_name, 'username', u.username, 'employeeNo', t.employee_no))
          FROM curriculum_teachers ct
          INNER JOIN teachers t ON t.id = ct.teacher_id
          INNER JOIN users u ON u.id = t.user_id
          WHERE ct.curriculum_id = c.id
        ),
        JSON_ARRAY()
       ) AS teachersJson
     FROM curriculums c
     LEFT JOIN departments d ON d.id = c.department_id
     LEFT JOIN students s ON s.curriculum_id = c.id OR (s.curriculum_id IS NULL AND s.program = c.title)
     LEFT JOIN courses co ON co.curriculum_id = c.id
     LEFT JOIN materials m ON m.course_id = co.id
     WHERE c.id = ?
     GROUP BY c.id, c.title, c.code, c.description, c.duration, c.academic_year, c.department_id, d.name, c.created_by, c.is_active, c.created_at
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapCurriculum(rows[0]) : null;
}

const mapModule = (row) => ({
  id: row.id,
  curriculumId: row.curriculumId,
  teacherId: row.teacherId || null,
  title: row.title,
  code: row.code,
  description: row.description || '',
  creditHours: row.creditHours === null || row.creditHours === undefined ? '' : String(row.creditHours),
  status: row.isActive ? 'Active' : 'Inactive',
  materials: Number(row.materials || 0),
  weeks: row.weeks || [],
  createdDate: row.createdDate,
});

export async function listCurriculumModules(curriculumId) {
  await ensureCurriculumManagementSchema();
  await ensureCurriculumFileCourseSchema();
  const [rows] = await db.query(
    `SELECT
       co.id,
       co.curriculum_id AS curriculumId,
       co.teacher_id AS teacherId,
       co.title,
       co.code,
       co.description,
       co.credit_hours AS creditHours,
       co.is_active AS isActive,
       DATE_FORMAT(co.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT m.id) AS materials
     FROM courses co
     LEFT JOIN materials m ON m.course_id = co.id
     WHERE co.curriculum_id = ?
     GROUP BY co.id, co.curriculum_id, co.teacher_id, co.title, co.code, co.description, co.credit_hours, co.is_active, co.created_at
     ORDER BY co.created_at DESC, co.id DESC`,
    [curriculumId],
  );
  const modules = rows.map(mapModule);
  if (!modules.length) return modules;

  const moduleIds = modules.map((module) => module.id);
  const [files] = await db.query(
    `SELECT
       id,
       course_id AS courseId,
       original_file_name AS originalFileName,
       file_type AS fileType,
       file_size AS fileSize,
       week_no AS weekNo,
       topic,
       description,
       visibility,
       audience,
       status,
       version,
       download_count AS downloadCount,
       view_count AS viewCount,
       DATE_FORMAT(created_at, '%Y-%m-%d') AS createdDate
     FROM files
     WHERE course_id IN (${moduleIds.map(() => '?').join(', ')})
      AND status <> 'deleted'
     ORDER BY week_no ASC, created_at DESC, id DESC`,
    moduleIds,
  );

  const filesByModule = new Map();
  files.forEach((file) => {
    const list = filesByModule.get(Number(file.courseId)) || [];
    list.push(file);
    filesByModule.set(Number(file.courseId), list);
  });

  return modules.map((module) => {
    const weeks = new Map();
    (filesByModule.get(Number(module.id)) || []).forEach((file) => {
      const weekNo = Number(file.weekNo || 0);
      const key = weekNo || 'unassigned';
      if (!weeks.has(key)) {
        weeks.set(key, { weekNo, files: [] });
      }
      weeks.get(key).files.push(file);
    });

    return {
      ...module,
      weeks: Array.from(weeks.values()).sort((a, b) => Number(a.weekNo || 0) - Number(b.weekNo || 0)),
    };
  });
}

export async function findCurriculumModuleById(curriculumId, moduleId) {
  await ensureCurriculumManagementSchema();
  const [rows] = await db.query(
    `SELECT
       co.id,
       co.curriculum_id AS curriculumId,
       co.teacher_id AS teacherId,
       co.title,
       co.code,
       co.description,
       co.credit_hours AS creditHours,
       co.is_active AS isActive,
       DATE_FORMAT(co.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT m.id) AS materials
     FROM courses co
     LEFT JOIN materials m ON m.course_id = co.id
     WHERE co.curriculum_id = ? AND co.id = ?
     GROUP BY co.id, co.curriculum_id, co.teacher_id, co.title, co.code, co.description, co.credit_hours, co.is_active, co.created_at
     LIMIT 1`,
    [curriculumId, moduleId],
  );
  return rows[0] ? mapModule(rows[0]) : null;
}

export async function createCurriculumModule(curriculumId, payload) {
  await ensureCurriculumManagementSchema();
  const [result] = await db.query(
    `INSERT INTO courses (uuid, curriculum_id, title, code, description, credit_hours, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      curriculumId,
      payload.title,
      payload.code,
      payload.description || null,
      payload.creditHours,
      payload.status === 'Active' ? 1 : 0,
    ],
  );
  return findCurriculumModuleById(curriculumId, result.insertId);
}

export async function updateCurriculumModule(curriculumId, moduleId, payload) {
  await ensureCurriculumManagementSchema();
  const [result] = await db.query(
    `UPDATE courses
     SET title = ?, code = ?, description = ?, credit_hours = ?, is_active = ?
     WHERE curriculum_id = ? AND id = ?`,
    [
      payload.title,
      payload.code,
      payload.description || null,
      payload.creditHours,
      payload.status === 'Active' ? 1 : 0,
      curriculumId,
      moduleId,
    ],
  );
  return result.affectedRows ? findCurriculumModuleById(curriculumId, moduleId) : null;
}

export async function deleteCurriculumModule(curriculumId, moduleId) {
  const [result] = await db.query('DELETE FROM courses WHERE curriculum_id = ? AND id = ?', [curriculumId, moduleId]);
  return result.affectedRows > 0;
}

export async function createCurriculumRecord(payload) {
  await ensureCurriculumManagementSchema();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO curriculums (uuid, title, code, description, duration, academic_year, department_id, created_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        payload.name,
        payload.code,
        payload.description || null,
        payload.duration || null,
        payload.academicYear || null,
        payload.departmentId || null,
        payload.createdBy || null,
        payload.status === 'Active' ? 1 : 0,
      ],
    );
    await connection.commit();
    return findCurriculumById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateCurriculumRecord(id, payload) {
  await ensureCurriculumManagementSchema();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `UPDATE curriculums
       SET title = ?, code = ?, description = ?, duration = ?, academic_year = ?, department_id = ?, is_active = ?
       WHERE id = ?`,
      [
        payload.name,
        payload.code,
        payload.description || null,
        payload.duration || null,
        payload.academicYear || null,
        payload.departmentId || null,
        payload.status === 'Active' ? 1 : 0,
        id,
      ],
    );
    await connection.commit();
    return result.affectedRows ? findCurriculumById(id) : null;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteCurriculumRecord(id) {
  const [result] = await db.query('DELETE FROM curriculums WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

import { randomUUID } from 'crypto';
import { db } from '../config/database.js';

const parseTeachers = (value) => {
  if (!value) return [];
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
};

const mapCurriculum = (row) => ({
  id: row.id,
  name: row.title,
  code: row.code,
  description: row.description || '',
  duration: row.duration || '',
  academicYear: row.academicYear || '',
  teachers: parseTeachers(row.teachersJson),
  students: Number(row.students || 0),
  subjects: Number(row.subjects || 0),
  materials: Number(row.materials || 0),
  status: row.isActive ? 'Active' : 'Archived',
  createdDate: row.createdDate,
});

let studentCurriculumSchemaReady = false;
let curriculumManagementSchemaReady = false;

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

export async function listCurriculums({ search = '', status = '', page = 1, limit = 10, sort = 'createdDate', direction = 'desc' } = {}) {
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

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const fromClause = `FROM curriculums c
     LEFT JOIN students s ON s.curriculum_id = c.id OR (s.curriculum_id IS NULL AND s.program = c.title)
     LEFT JOIN courses co ON co.curriculum_id = c.id
     LEFT JOIN materials m ON m.course_id = co.id
     LEFT JOIN curriculum_teachers ct ON ct.curriculum_id = c.id
     LEFT JOIN teachers t ON t.id = ct.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     ${where}`;

  const [rows] = await db.query(
    `SELECT
       c.id,
       c.title,
       c.code,
       c.description,
       c.duration,
       c.academic_year AS academicYear,
       c.is_active AS isActive,
       DATE_FORMAT(c.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT s.id) AS students,
       COUNT(DISTINCT co.id) AS subjects,
       COUNT(DISTINCT m.id) AS materials,
       COALESCE(
        JSON_ARRAYAGG(
          CASE
            WHEN t.id IS NULL THEN NULL
            ELSE JSON_OBJECT('id', t.id, 'fullName', u.full_name, 'employeeNo', t.employee_no)
          END
        ),
        JSON_ARRAY()
       ) AS teachersJson
     ${fromClause}
     GROUP BY c.id, c.title, c.code, c.description, c.duration, c.academic_year, c.is_active, c.created_at
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
       c.is_active AS isActive,
       DATE_FORMAT(c.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT s.id) AS students,
       COUNT(DISTINCT co.id) AS subjects,
       COUNT(DISTINCT m.id) AS materials,
       COALESCE(
        JSON_ARRAYAGG(
          CASE
            WHEN t.id IS NULL THEN NULL
            ELSE JSON_OBJECT('id', t.id, 'fullName', u.full_name, 'employeeNo', t.employee_no)
          END
        ),
        JSON_ARRAY()
       ) AS teachersJson
     FROM curriculums c
     LEFT JOIN students s ON s.curriculum_id = c.id OR (s.curriculum_id IS NULL AND s.program = c.title)
     LEFT JOIN courses co ON co.curriculum_id = c.id
     LEFT JOIN materials m ON m.course_id = co.id
     LEFT JOIN curriculum_teachers ct ON ct.curriculum_id = c.id
     LEFT JOIN teachers t ON t.id = ct.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     WHERE c.id = ?
     GROUP BY c.id, c.title, c.code, c.description, c.duration, c.academic_year, c.is_active, c.created_at
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapCurriculum(rows[0]) : null;
}

async function syncCurriculumTeachers(connection, curriculumId, teacherIds = []) {
  const uniqueIds = [...new Set((teacherIds || []).map(Number).filter(Boolean))];
  await connection.query('DELETE FROM curriculum_teachers WHERE curriculum_id = ?', [curriculumId]);

  if (!uniqueIds.length) return;

  const [teachers] = await connection.query(
    `SELECT t.id
     FROM teachers t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.id IN (${uniqueIds.map(() => '?').join(',')})
      AND u.role = 'teacher'
      AND u.status = 'active'`,
    uniqueIds,
  );
  const validIds = teachers.map((teacher) => teacher.id);

  if (!validIds.length) return;

  await connection.query(
    `INSERT INTO curriculum_teachers (curriculum_id, teacher_id)
     VALUES ${validIds.map(() => '(?, ?)').join(', ')}`,
    validIds.flatMap((teacherId) => [curriculumId, teacherId]),
  );
}

export async function createCurriculumRecord(payload) {
  await ensureCurriculumManagementSchema();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO curriculums (uuid, title, code, description, duration, academic_year, created_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        payload.name,
        payload.code,
        payload.description || null,
        payload.duration || null,
        payload.academicYear || null,
        payload.createdBy || null,
        payload.status === 'Active' ? 1 : 0,
      ],
    );
    await syncCurriculumTeachers(connection, result.insertId, payload.assignedTeacherIds);
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
       SET title = ?, code = ?, description = ?, duration = ?, academic_year = ?, is_active = ?
       WHERE id = ?`,
      [
        payload.name,
        payload.code,
        payload.description || null,
        payload.duration || null,
        payload.academicYear || null,
        payload.status === 'Active' ? 1 : 0,
        id,
      ],
    );
    if (result.affectedRows) {
      await syncCurriculumTeachers(connection, id, payload.assignedTeacherIds);
    }
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

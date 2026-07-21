import { randomUUID } from 'crypto';
import { db } from '../config/database.js';

const mapCurriculum = (row) => ({
  id: row.id,
  name: row.title,
  code: row.code,
  description: row.description || '',
  duration: '',
  semester: '',
  academicYear: '',
  teachers: [],
  students: Number(row.students || 0),
  subjects: Number(row.subjects || 0),
  materials: Number(row.materials || 0),
  status: row.isActive ? 'Active' : 'Archived',
  createdDate: row.createdDate,
});

let studentCurriculumSchemaReady = false;

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

export async function listCurriculums({ search = '', status = '', page = 1, limit = 10 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;
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
     LEFT JOIN students s ON s.program = c.title
     LEFT JOIN courses co ON co.curriculum_id = c.id
     LEFT JOIN materials m ON m.course_id = co.id
     ${where}`;

  const [rows] = await db.query(
    `SELECT
       c.id,
       c.title,
       c.code,
       c.description,
       c.is_active AS isActive,
       DATE_FORMAT(c.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT s.id) AS students,
       COUNT(DISTINCT co.id) AS subjects,
       COUNT(DISTINCT m.id) AS materials
     ${fromClause}
     GROUP BY c.id, c.title, c.code, c.description, c.is_active, c.created_at
     ORDER BY c.created_at DESC
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
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.title,
       c.code,
       c.description,
       c.is_active AS isActive,
       DATE_FORMAT(c.created_at, '%Y-%m-%d') AS createdDate,
       COUNT(DISTINCT s.id) AS students,
       COUNT(DISTINCT co.id) AS subjects,
       COUNT(DISTINCT m.id) AS materials
     FROM curriculums c
     LEFT JOIN students s ON s.program = c.title
     LEFT JOIN courses co ON co.curriculum_id = c.id
     LEFT JOIN materials m ON m.course_id = co.id
     WHERE c.id = ?
     GROUP BY c.id, c.title, c.code, c.description, c.is_active, c.created_at
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapCurriculum(rows[0]) : null;
}

export async function createCurriculumRecord(payload) {
  const [result] = await db.query(
    `INSERT INTO curriculums (uuid, title, code, description, created_by, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      payload.name,
      payload.code,
      payload.description || null,
      payload.createdBy || null,
      payload.status === 'Active' ? 1 : 0,
    ],
  );
  return findCurriculumById(result.insertId);
}

export async function updateCurriculumRecord(id, payload) {
  const [result] = await db.query(
    `UPDATE curriculums
     SET title = ?, code = ?, description = ?, is_active = ?
     WHERE id = ?`,
    [
      payload.name,
      payload.code,
      payload.description || null,
      payload.status === 'Active' ? 1 : 0,
      id,
    ],
  );

  return result.affectedRows ? findCurriculumById(id) : null;
}

export async function deleteCurriculumRecord(id) {
  const [result] = await db.query('DELETE FROM curriculums WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

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

export async function listCurriculums({ search = '', status = '' } = {}) {
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
     ${where}
     GROUP BY c.id, c.title, c.code, c.description, c.is_active, c.created_at
     ORDER BY c.created_at DESC`,
    params,
  );

  return rows.map(mapCurriculum);
}

export async function findCurriculumById(id) {
  const rows = await listCurriculums();
  return rows.find((item) => Number(item.id) === Number(id)) || null;
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

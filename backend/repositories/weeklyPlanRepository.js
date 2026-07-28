import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { generateId } from '../utils/idGenerator.js';
import { ensureUserAssignmentSchema } from './userManagementRepository.js';

let weeklyPlanSchemaReady = false;

async function columnExists(columnName) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'weekly_teaching_plan'
      AND COLUMN_NAME = ?`,
    [columnName],
  );
  return rows.length > 0;
}

async function addColumnIfMissing(columnName, ddl) {
  if (!(await columnExists(columnName))) {
    await db.query(`ALTER TABLE weekly_teaching_plan ADD COLUMN ${ddl}`);
  }
}

async function addIndexIfMissing(indexName, ddl) {
  const [rows] = await db.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'weekly_teaching_plan'
      AND INDEX_NAME = ?`,
    [indexName],
  );
  if (!rows.length) {
    await db.query(ddl);
  }
}

export async function ensureWeeklyPlanSchema() {
  if (weeklyPlanSchemaReady) return;
  await ensureUserAssignmentSchema();
  await db.query(
    `CREATE TABLE IF NOT EXISTS weekly_teaching_plan (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(36) NOT NULL UNIQUE,
      course_id BIGINT UNSIGNED NULL,
      teacher_id BIGINT UNSIGNED NOT NULL,
      week_no INT UNSIGNED NOT NULL,
      topic VARCHAR(180) NOT NULL,
      objectives TEXT NULL,
      activities TEXT NULL,
      resources TEXT NULL,
      planned_date DATE NULL,
      status ENUM('draft', 'published', 'completed', 'upcoming') NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  );

  await addColumnIfMissing('department_id', 'department_id BIGINT UNSIGNED NULL AFTER teacher_id');
  await addColumnIfMissing(
    'content_type',
    "content_type ENUM('completed', 'upcoming') NOT NULL DEFAULT 'upcoming' AFTER department_id",
  );
  await addColumnIfMissing('attachment_file_id', 'attachment_file_id BIGINT UNSIGNED NULL AFTER resources');
  await addColumnIfMissing('resource_link', 'resource_link VARCHAR(1000) NULL AFTER attachment_file_id');
  await addColumnIfMissing('created_by_user_id', 'created_by_user_id BIGINT UNSIGNED NULL AFTER status');
  await addColumnIfMissing('updated_by_user_id', 'updated_by_user_id BIGINT UNSIGNED NULL AFTER created_by_user_id');
  await addIndexIfMissing(
    'idx_weekly_plan_department_week',
    'CREATE INDEX idx_weekly_plan_department_week ON weekly_teaching_plan (department_id, week_no, content_type)',
  );
  await addIndexIfMissing(
    'idx_weekly_plan_teacher_week',
    'CREATE INDEX idx_weekly_plan_teacher_week ON weekly_teaching_plan (teacher_id, week_no, content_type)',
  );
  weeklyPlanSchemaReady = true;
}

export async function findTeacherProfileByUserId(userId) {
  await ensureUserAssignmentSchema();
  const [rows] = await db.execute(
    `SELECT t.id, t.user_id AS userId, u.username, u.full_name AS fullName
     FROM teachers t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.user_id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

export async function teacherHasDepartment(userId, departmentId) {
  await ensureUserAssignmentSchema();
  const [rows] = await db.execute(
    `SELECT 1
     FROM teachers t
     INNER JOIN teacher_departments td ON td.teacher_id = t.id
     INNER JOIN departments d ON d.id = td.department_id
     WHERE t.user_id = ?
      AND td.department_id = ?
      AND d.status = 'active'
     LIMIT 1`,
    [userId, departmentId],
  );
  return rows.length > 0;
}

export async function adminOwnsDepartment(userId, departmentId) {
  const [rows] = await db.execute(
    "SELECT 1 FROM departments WHERE id = ? AND status = 'active' AND created_by = ? LIMIT 1",
    [departmentId, userId],
  );
  return rows.length > 0;
}

function baseSelect() {
  return `SELECT wp.id, wp.uuid, wp.course_id AS courseId, wp.teacher_id AS teacherId,
    wp.department_id AS departmentId, d.name AS departmentName, wp.content_type AS contentType,
    wp.week_no AS weekNo, wp.topic, wp.objectives, wp.activities, wp.resources,
    wp.attachment_file_id AS attachmentFileId, f.original_file_name AS attachmentFileName,
    f.file_type AS attachmentFileType, f.file_size AS attachmentFileSize,
    wp.resource_link AS resourceLink, wp.planned_date AS plannedDate, wp.status,
    wp.created_by_user_id AS createdByUserId, wp.updated_by_user_id AS updatedByUserId,
    wp.created_at AS createdAt, wp.updated_at AS updatedAt,
    tu.username AS teacherUsername, tu.full_name AS teacherName
   FROM weekly_teaching_plan wp
   INNER JOIN teachers t ON t.id = wp.teacher_id
   INNER JOIN users tu ON tu.id = t.user_id
   LEFT JOIN departments d ON d.id = wp.department_id
   LEFT JOIN files f ON f.id = wp.attachment_file_id`;
}

function applyScope(user, where, values) {
  if (user.role === ROLES.SUPER_ADMIN) return;

  if (user.role === ROLES.ADMIN) {
    where.push('(wp.created_by_user_id = ? OR d.created_by = ?)');
    values.push(user.id, user.id);
    return;
  }

  if (user.role === ROLES.TEACHER) {
    where.push(`EXISTS (
      SELECT 1
      FROM teacher_departments scoped_td
      INNER JOIN teachers scoped_teacher ON scoped_teacher.id = scoped_td.teacher_id
      WHERE scoped_teacher.user_id = ?
       AND scoped_td.department_id = wp.department_id
    )`);
    values.push(user.id);
  }
}

export async function listWeeklyPlans(user, filters = {}) {
  await ensureWeeklyPlanSchema();
  const where = [];
  const values = [];
  applyScope(user, where, values);

  if (filters.contentType) {
    where.push('wp.content_type = ?');
    values.push(filters.contentType);
  }
  if (filters.status) {
    where.push('wp.status = ?');
    values.push(filters.status);
  }
  if (filters.departmentId) {
    where.push('wp.department_id = ?');
    values.push(Number(filters.departmentId));
  }
  if (filters.weekNo) {
    where.push('wp.week_no = ?');
    values.push(Number(filters.weekNo));
  }
  if (filters.search) {
    where.push('(wp.topic LIKE ? OR wp.objectives LIKE ? OR wp.activities LIKE ? OR wp.resources LIKE ? OR d.name LIKE ?)');
    const term = `%${filters.search}%`;
    values.push(term, term, term, term, term);
  }

  const limit = Math.min(Number(filters.limit || 50), 100);
  const page = Math.max(Number(filters.page || 1), 1);
  const offset = (page - 1) * limit;
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.query(
    `${baseSelect()} ${whereSql} ORDER BY wp.week_no DESC, wp.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM weekly_teaching_plan wp
     INNER JOIN teachers t ON t.id = wp.teacher_id
     INNER JOIN users tu ON tu.id = t.user_id
     LEFT JOIN departments d ON d.id = wp.department_id
     LEFT JOIN files f ON f.id = wp.attachment_file_id
     ${whereSql}`,
    values,
  );

  return { plans: rows, total: countRows[0]?.total || 0, page, limit };
}

export async function findWeeklyPlanById(id) {
  await ensureWeeklyPlanSchema();
  const [rows] = await db.execute(`${baseSelect()} WHERE wp.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function createWeeklyPlanRecord(payload) {
  await ensureWeeklyPlanSchema();
  const [result] = await db.execute(
    `INSERT INTO weekly_teaching_plan
      (uuid, course_id, teacher_id, department_id, content_type, week_no, topic, objectives,
       activities, resources, attachment_file_id, resource_link, planned_date, status,
       created_by_user_id, updated_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.courseId || null,
      payload.teacherId,
      payload.departmentId,
      payload.contentType,
      payload.weekNo,
      payload.topic,
      payload.objectives || null,
      payload.activities || null,
      payload.resources || null,
      payload.attachmentFileId || null,
      payload.resourceLink || null,
      payload.plannedDate || null,
      payload.status,
      payload.createdByUserId || null,
      payload.updatedByUserId || null,
    ],
  );
  return result.insertId;
}

export async function updateWeeklyPlanRecord(id, payload) {
  await ensureWeeklyPlanSchema();
  const allowed = {
    courseId: 'course_id',
    departmentId: 'department_id',
    contentType: 'content_type',
    weekNo: 'week_no',
    topic: 'topic',
    objectives: 'objectives',
    activities: 'activities',
    resources: 'resources',
    attachmentFileId: 'attachment_file_id',
    resourceLink: 'resource_link',
    plannedDate: 'planned_date',
    status: 'status',
    updatedByUserId: 'updated_by_user_id',
  };
  const entries = Object.entries(payload).filter(([key]) => allowed[key]);
  if (!entries.length) return false;
  const assignments = entries.map(([key]) => `${allowed[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value || null);
  await db.execute(`UPDATE weekly_teaching_plan SET ${assignments}, updated_at = NOW() WHERE id = ?`, [...values, id]);
  return true;
}

export async function deleteWeeklyPlanRecord(id) {
  const [result] = await db.execute('DELETE FROM weekly_teaching_plan WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

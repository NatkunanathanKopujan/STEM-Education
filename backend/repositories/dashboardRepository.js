import { db } from '../config/database.js';

export async function getDashboardSummary() {
  const [[userCounts]] = await db.query(
    `SELECT
       SUM(role = 'admin') AS admins,
       SUM(role = 'teacher') AS teachers,
       SUM(role = 'student') AS students,
       SUM(status = 'active') AS activeUsers
     FROM users`,
  );
  const [[totals]] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM curriculums) AS curriculums,
       (SELECT COUNT(*) FROM courses) AS courses,
       (SELECT COUNT(*) FROM materials) AS materials,
       (SELECT COUNT(*) FROM files) AS files,
       (SELECT COUNT(*) FROM quiz_attempts) AS quizAttempts,
       (SELECT COUNT(*) FROM login_history WHERE DATE(created_at) = CURRENT_DATE()) AS todaysLogins`,
  );
  const [monthlyRegistrations] = await db.query(
    `SELECT
       DATE_FORMAT(created_at, '%b') AS month,
       SUM(role = 'admin') AS admins,
       SUM(role = 'teacher') AS teachers,
       SUM(role = 'student') AS students
     FROM users
     WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
     GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
     ORDER BY YEAR(created_at), MONTH(created_at)`,
  );
  const [recentActivities] = await db.query(
    `SELECT action, module, description, created_at AS createdAt
     FROM audit_logs
     ORDER BY created_at DESC
     LIMIT 5`,
  );
  const [notifications] = await db.query(
    `SELECT title, message, notification_type AS type, priority, created_at AS createdAt
     FROM notifications
     ORDER BY created_at DESC
     LIMIT 5`,
  );

  return {
    counts: {
      admins: Number(userCounts.admins || 0),
      teachers: Number(userCounts.teachers || 0),
      students: Number(userCounts.students || 0),
      activeUsers: Number(userCounts.activeUsers || 0),
      curriculums: Number(totals.curriculums || 0),
      courses: Number(totals.courses || 0),
      subjects: Number(totals.courses || 0),
      materials: Number(totals.materials || 0),
      files: Number(totals.files || 0),
      quizAttempts: Number(totals.quizAttempts || 0),
      todaysLogins: Number(totals.todaysLogins || 0),
    },
    monthlyRegistrations: monthlyRegistrations.map((row) => ({
      month: row.month,
      admins: Number(row.admins || 0),
      teachers: Number(row.teachers || 0),
      students: Number(row.students || 0),
    })),
    recentActivities,
    notifications,
  };
}

export async function listDashboardUsers() {
  const [rows] = await db.query(
    `SELECT id, full_name AS fullName, username, email, role, status
     FROM users
     WHERE role IN ('admin', 'teacher', 'student')
     ORDER BY created_at DESC`,
  );

  return rows.map((row) => ({
    ...row,
    role: row.role
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' '),
    status: row.status === 'active' ? 'Active' : 'Inactive',
  }));
}

export async function listDashboardCurriculums() {
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.title AS name,
       c.code,
       c.description,
       c.is_active AS isActive,
       COUNT(DISTINCT co.teacher_id) AS teachers,
       COUNT(DISTINCT s.id) AS students,
       COUNT(DISTINCT co.id) AS lessons,
       COUNT(DISTINCT m.id) AS materials
     FROM curriculums c
     LEFT JOIN courses co ON co.curriculum_id = c.id
     LEFT JOIN students s ON s.program = c.title
     LEFT JOIN materials m ON m.course_id = co.id
     GROUP BY c.id, c.title, c.code, c.description, c.is_active
     ORDER BY c.created_at DESC`,
  );

  return rows.map((row) => ({
    ...row,
    status: row.isActive ? 'Active' : 'Archived',
    teachers: Number(row.teachers || 0),
    students: Number(row.students || 0),
    lessons: Number(row.lessons || 0),
    materials: Number(row.materials || 0),
  }));
}

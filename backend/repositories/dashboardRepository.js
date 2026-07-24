import { db } from '../config/database.js';
import { ensureAdminScopeSchema } from './userManagementRepository.js';

export async function getDashboardSummary(user = null) {
  const adminScoped = user?.role === 'admin';
  const adminId = user?.id || 0;
  if (adminScoped) {
    await ensureAdminScopeSchema();
  }
  const [[profileCounts]] = await db.query(
    `SELECT
       (SELECT COUNT(*)
        FROM admins a
        INNER JOIN users u ON u.id = a.user_id
        WHERE u.role = 'admin' AND u.status = 'active') AS admins,
       (SELECT COUNT(*)
        FROM teachers t
        INNER JOIN users u ON u.id = t.user_id
        WHERE u.role = 'teacher' AND u.status = 'active'
          ${adminScoped ? 'AND t.managed_by_admin_id = ?' : ''}) AS teachers,
       (SELECT COUNT(*)
        FROM students s
        INNER JOIN users u ON u.id = s.user_id
        WHERE u.role = 'student' AND u.status = 'active'
          ${adminScoped ? 'AND s.managed_by_admin_id = ?' : ''}) AS students,
       (SELECT COUNT(*)
        FROM users u
        WHERE u.status = 'active'
          ${adminScoped ? `AND (
            u.id = ?
            OR EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = u.id AND t.managed_by_admin_id = ?)
            OR EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.managed_by_admin_id = ?)
          )` : ''}) AS activeUsers`,
    adminScoped ? [adminId, adminId, adminId, adminId, adminId] : [],
  );
  const [[totals]] = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM curriculums ${adminScoped ? 'WHERE created_by = ?' : ''}) AS curriculums,
       (SELECT COUNT(*)
        FROM courses co
        INNER JOIN curriculums c ON c.id = co.curriculum_id
        ${adminScoped ? 'WHERE c.created_by = ?' : ''}) AS courses,
       (SELECT COUNT(*) FROM materials) AS materials,
       (SELECT COUNT(*) FROM files) AS files,
       (SELECT COUNT(*) FROM quiz_attempts) AS quizAttempts,
       (SELECT COUNT(*) FROM login_history WHERE DATE(created_at) = CURRENT_DATE()
          ${adminScoped ? `AND (
            user_id = ?
            OR EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = login_history.user_id AND t.managed_by_admin_id = ?)
            OR EXISTS (SELECT 1 FROM students s WHERE s.user_id = login_history.user_id AND s.managed_by_admin_id = ?)
          )` : ''}) AS todaysLogins`,
    adminScoped ? [adminId, adminId, adminId, adminId, adminId] : [],
  );
  const [monthlyRegistrations] = await db.query(
    `SELECT
       DATE_FORMAT(month_start, '%b') AS month,
       SUM(admins) AS admins,
       SUM(teachers) AS teachers,
       SUM(students) AS students
     FROM (
       SELECT DATE_FORMAT(a.created_at, '%Y-%m-01') AS month_start,
        COUNT(*) AS admins, 0 AS teachers, 0 AS students
       FROM admins a
       INNER JOIN users u ON u.id = a.user_id
       WHERE u.status = 'active'
       GROUP BY DATE_FORMAT(a.created_at, '%Y-%m-01')
       UNION ALL
       SELECT DATE_FORMAT(t.created_at, '%Y-%m-01') AS month_start,
        0 AS admins, COUNT(*) AS teachers, 0 AS students
       FROM teachers t
       INNER JOIN users u ON u.id = t.user_id
       WHERE u.status = 'active'
        ${adminScoped ? 'AND t.managed_by_admin_id = ?' : ''}
       GROUP BY DATE_FORMAT(t.created_at, '%Y-%m-01')
       UNION ALL
       SELECT DATE_FORMAT(s.created_at, '%Y-%m-01') AS month_start,
        0 AS admins, 0 AS teachers, COUNT(*) AS students
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       WHERE u.status = 'active'
        ${adminScoped ? 'AND s.managed_by_admin_id = ?' : ''}
       GROUP BY DATE_FORMAT(s.created_at, '%Y-%m-01')
     ) registration_months
     GROUP BY month_start
     ORDER BY month_start`,
    adminScoped ? [adminId, adminId] : [],
  );
  const activityFilters = [];
  const activityParams = [];

  if (user?.role === 'admin') {
    activityFilters.push('a.user_id = ?');
    activityParams.push(user.id);
  }

  const activityWhere = activityFilters.length ? `WHERE ${activityFilters.join(' AND ')}` : '';
  const [recentActivities] = await db.query(
    `SELECT a.id, a.action, a.module, a.description, a.status, a.role,
      a.created_at AS createdAt, COALESCE(u.full_name, 'System') AS userName
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${activityWhere}
     ORDER BY a.created_at DESC
     LIMIT 8`,
    activityParams,
  );
  const [announcements] = await db.query(
    `SELECT DISTINCT a.id, a.title, a.body AS message, a.priority, a.publish_at AS publishDate,
       a.created_at AS createdAt
     FROM announcements a
     LEFT JOIN announcement_targets at ON at.announcement_id = a.id
     LEFT JOIN teachers t ON t.user_id = ?
     LEFT JOIN students s ON s.user_id = ?
     WHERE a.status = 'published'
       AND (a.publish_at IS NULL OR a.publish_at <= NOW())
       AND (a.expiry_at IS NULL OR a.expiry_at > NOW())
       AND (a.audience_role IS NULL OR a.audience_role = ?)
       AND (
        at.id IS NULL
        OR at.target_type = 'all_users'
        OR (at.target_type = 'role' AND at.target_role = ?)
        OR (at.target_type = 'teacher' AND (at.target_id = ? OR at.target_id = t.id))
        OR (at.target_type = 'student' AND (at.target_id = ? OR at.target_id = s.id))
        OR (at.target_type = 'curriculum' AND EXISTS (
          SELECT 1 FROM courses c WHERE c.curriculum_id = at.target_id AND c.teacher_id = t.id
        ))
       )
     ORDER BY COALESCE(a.publish_at, a.created_at) DESC, a.created_at DESC
     LIMIT 5`,
    [user?.id || 0, user?.id || 0, user?.role || '', user?.role || '', user?.id || 0, user?.id || 0],
  );

  return {
    counts: {
      admins: Number(profileCounts.admins || 0),
      teachers: Number(profileCounts.teachers || 0),
      students: Number(profileCounts.students || 0),
      activeUsers: Number(profileCounts.activeUsers || 0),
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
    announcements,
    notifications: announcements,
  };
}

export async function listDashboardUsers(user = null) {
  const adminScoped = user?.role === 'admin';
  if (adminScoped) {
    await ensureAdminScopeSchema();
  }
  const [rows] = await db.query(
    `SELECT id, full_name AS fullName, username, email, role, status
     FROM users u
     WHERE role IN ('admin', 'teacher', 'student')
      ${adminScoped ? `AND (
        u.id = ?
        OR EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = u.id AND t.managed_by_admin_id = ?)
        OR EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id AND s.managed_by_admin_id = ?)
      )` : ''}
     ORDER BY created_at DESC`,
    adminScoped ? [user.id, user.id, user.id] : [],
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

export async function listDashboardCurriculums(user = null) {
  const adminScoped = user?.role === 'admin';
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
     ${adminScoped ? 'WHERE c.created_by = ?' : ''}
     GROUP BY c.id, c.title, c.code, c.description, c.is_active
     ORDER BY c.created_at DESC`,
    adminScoped ? [user.id] : [],
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

import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { generateId } from '../utils/idGenerator.js';
import { createNotification } from './notificationRepository.js';

function teacherAttemptScope(user, alias = 'qa') {
  if (user.role !== ROLES.TEACHER) {
    return { clause: '', values: [] };
  }

  return {
    clause: `AND EXISTS (
      SELECT 1 FROM quiz_attempt_answers scoped_answers
      INNER JOIN question_bank scoped_questions ON scoped_questions.id = scoped_answers.question_id
      WHERE scoped_answers.attempt_id = ${alias}.id AND scoped_questions.created_by = ?
    )`,
    values: [user.id],
  };
}

function questionScope(user, alias = 'qb') {
  if (user.role !== ROLES.TEACHER) {
    return { clause: '', values: [] };
  }

  return { clause: `AND ${alias}.created_by = ?`, values: [user.id] };
}

function materialScope(user, alias = 'm') {
  if (user.role !== ROLES.TEACHER) {
    return { clause: '', values: [] };
  }

  return { clause: `AND ${alias}.uploaded_by = ?`, values: [user.id] };
}

function buildReportFilters(filters = {}, alias = 'qa') {
  const where = [];
  const values = [];

  if (filters.dateFrom) {
    where.push(`${alias}.created_at >= ?`);
    values.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    where.push(`${alias}.created_at <= ?`);
    values.push(filters.dateTo);
  }

  if (filters.curriculumId) {
    where.push(`${alias}.curriculum_id = ?`);
    values.push(filters.curriculumId);
  }

  if (filters.quizNumber) {
    where.push(`${alias}.quiz_number = ?`);
    values.push(filters.quizNumber);
  }

  return { clause: where.length ? `AND ${where.join(' AND ')}` : '', values };
}

export async function findStudentIdByUser(userId) {
  const [rows] = await db.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0]?.id || null;
}

export async function getDashboardCounts(user) {
  const studentId = user.role === ROLES.STUDENT ? await findStudentIdByUser(user.id) : null;
  const teacherScope = teacherAttemptScope(user);
  const studentWhere = studentId ? 'AND qa.student_id = ?' : '';
  const values = [...teacherScope.values, ...(studentId ? [studentId] : [])];

  const [userRows] = await db.execute(
    `SELECT COUNT(*) AS totalUsers,
      SUM(role = 'admin') AS totalAdmins,
      SUM(role = 'teacher') AS totalTeachers,
      SUM(role = 'student') AS totalStudents,
      SUM(status = 'active') AS dailyActiveUsers,
      SUM(last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS monthlyActiveUsers
     FROM users`,
  );
  const [contentRows] = await db.execute(
    `SELECT
      (SELECT COUNT(*) FROM curriculums) AS totalCurriculums,
      (SELECT COUNT(*) FROM materials) AS totalLearningMaterials,
      (SELECT COUNT(*) FROM question_bank) AS totalAiQuestions`,
  );
  const [quizRows] = await db.execute(
    `SELECT COUNT(*) AS totalQuizAttempts,
      COALESCE(ROUND(AVG(qa.percentage), 2), 0) AS averageScore,
      COALESCE(MAX(qa.percentage), 0) AS highestScore,
      COALESCE(MIN(qa.percentage), 0) AS lowestScore,
      COALESCE(ROUND(100 * SUM(qa.pass_status = 'pass') / NULLIF(COUNT(*), 0), 2), 0) AS passRate
     FROM quiz_attempts qa
     WHERE qa.status = 'graded' ${teacherScope.clause} ${studentWhere}`,
    values,
  );

  return {
    ...(userRows[0] || {}),
    ...(contentRows[0] || {}),
    ...(quizRows[0] || {}),
    systemUsage: 72,
    storageUsage: 48,
  };
}

export async function getMonthlyActivity() {
  const [rows] = await db.execute(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
      SUM(role = 'student') AS students,
      SUM(role = 'teacher') AS teachers,
      SUM(role = 'admin') AS admins
     FROM users
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY month DESC
     LIMIT 12`,
  );

  return rows.reverse();
}

export async function getQuizReport(user, filters = {}) {
  const studentId = user.role === ROLES.STUDENT ? await findStudentIdByUser(user.id) : null;
  const scope = teacherAttemptScope(user, 'qa');
  const filterScope = buildReportFilters(filters, 'qa');
  const where = ['qa.status = \'graded\''];
  const values = [];

  if (studentId) {
    where.push('qa.student_id = ?');
    values.push(studentId);
  }

  const [attemptRows] = await db.execute(
    `SELECT qa.quiz_number AS quizNumber, qa.submitted_at AS attemptDate,
      s.id AS studentId, u.full_name AS studentName, qa.score, qa.percentage,
      qa.pass_status AS passStatus, qa.duration_seconds AS durationSeconds,
      GROUP_CONCAT(DISTINCT qb.topic ORDER BY qb.week_no SEPARATOR ', ') AS topics
     FROM quiz_attempts qa
     INNER JOIN students s ON s.id = qa.student_id
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN quiz_attempt_answers qaa ON qaa.attempt_id = qa.id
     LEFT JOIN question_bank qb ON qb.id = qaa.question_id
     WHERE ${where.join(' AND ')} ${scope.clause} ${filterScope.clause}
     GROUP BY qa.id, qa.quiz_number, qa.submitted_at, s.id, u.full_name, qa.score,
      qa.percentage, qa.pass_status, qa.duration_seconds
     ORDER BY qa.submitted_at DESC
     LIMIT 100`,
    [...values, ...scope.values, ...filterScope.values],
  );

  const questionFilter = questionScope(user, 'qb');
  const [difficultyRows] = await db.execute(
    `SELECT qb.difficulty, COUNT(*) AS totalQuestions,
      COALESCE(ROUND(100 * SUM(qaa.is_correct = 1) / NULLIF(COUNT(qaa.id), 0), 2), 0) AS correctRate
     FROM question_bank qb
     LEFT JOIN quiz_attempt_answers qaa ON qaa.question_id = qb.id
     WHERE 1 = 1 ${questionFilter.clause}
     GROUP BY qb.difficulty`,
    questionFilter.values,
  );

  const [topicRows] = await db.execute(
    `SELECT qb.topic, qb.week_no AS weekNo, COUNT(qaa.id) AS attempts,
      COALESCE(ROUND(AVG(CASE WHEN qaa.is_correct = 1 THEN 100 ELSE 0 END), 2), 0) AS averageScore
     FROM question_bank qb
     LEFT JOIN quiz_attempt_answers qaa ON qaa.question_id = qb.id
     WHERE qb.topic IS NOT NULL ${questionFilter.clause}
     GROUP BY qb.topic, qb.week_no
     ORDER BY averageScore ASC
     LIMIT 25`,
    questionFilter.values,
  );

  return {
    attempts: attemptRows,
    difficultyAnalysis: difficultyRows,
    topicAnalysis: topicRows,
    summary: {
      averageScore:
        attemptRows.reduce((total, item) => total + Number(item.percentage || 0), 0) /
        Math.max(attemptRows.length, 1),
      passRate:
        (attemptRows.filter((item) => item.passStatus === 'pass').length /
          Math.max(attemptRows.length, 1)) *
        100,
      failRate:
        (attemptRows.filter((item) => item.passStatus === 'fail').length /
          Math.max(attemptRows.length, 1)) *
        100,
    },
  };
}

export async function getStudentReport(user, filters = {}) {
  const studentId = user.role === ROLES.STUDENT ? await findStudentIdByUser(user.id) : null;
  const teacherScope = teacherAttemptScope(user, 'qa');
  const where = [];
  const values = [];

  if (studentId) {
    where.push('qa.student_id = ?');
    values.push(studentId);
  }

  if (filters.search) {
    where.push('(u.full_name LIKE ? OR s.student_no LIKE ?)');
    values.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const [rows] = await db.execute(
    `SELECT s.id AS studentId, s.student_no AS studentNo, u.full_name AS studentName,
      COUNT(qa.id) AS quizAttempts,
      COALESCE(ROUND(AVG(qa.percentage), 2), 0) AS averagePercentage,
      COALESCE(MAX(qa.percentage), 0) AS highestScore,
      COALESCE(MIN(qa.percentage), 0) AS lowestScore,
      MAX(qa.submitted_at) AS lastQuizDate
     FROM students s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN quiz_attempts qa ON qa.student_id = s.id AND qa.status = 'graded'
     ${where.length ? `WHERE ${where.join(' AND ')}` : 'WHERE 1 = 1'} ${teacherScope.clause}
     GROUP BY s.id, s.student_no, u.full_name
     ORDER BY averagePercentage DESC
     LIMIT 100`,
    [...values, ...teacherScope.values],
  );

  return rows;
}

export async function getTeacherReport() {
  const [rows] = await db.execute(
    `SELECT t.id AS teacherId, u.full_name AS teacherName, t.department,
      COUNT(DISTINCT c.id) AS assignedCourses,
      COUNT(DISTINCT m.id) AS learningMaterials,
      COUNT(DISTINCT qb.id) AS aiQuestions
     FROM teachers t
     INNER JOIN users u ON u.id = t.user_id
     LEFT JOIN courses c ON c.teacher_id = t.id
     LEFT JOIN materials m ON m.uploaded_by = u.id
     LEFT JOIN question_bank qb ON qb.created_by = u.id
     GROUP BY t.id, u.full_name, t.department
     ORDER BY learningMaterials DESC`,
  );

  return rows;
}

export async function getMaterialReport(user) {
  const scope = materialScope(user, 'm');
  const [rows] = await db.execute(
    `SELECT material_type AS materialType, COUNT(*) AS total
     FROM materials m
     WHERE 1 = 1 ${scope.clause}
     GROUP BY material_type
     ORDER BY total DESC`,
    scope.values,
  );

  const [activityRows] = await db.execute(
    `SELECT u.full_name AS teacherName, COUNT(m.id) AS uploadedMaterials
     FROM materials m
     LEFT JOIN users u ON u.id = m.uploaded_by
     WHERE 1 = 1 ${scope.clause}
     GROUP BY u.full_name
     ORDER BY uploadedMaterials DESC
     LIMIT 10`,
    scope.values,
  );

  return { materialTypes: rows, teacherActivity: activityRows };
}

export async function getAiReport(user) {
  const scope = user.role === ROLES.TEACHER ? 'WHERE teacher_id = ?' : '';
  const values = user.role === ROLES.TEACHER ? [user.id] : [];
  const [rows] = await db.execute(
    `SELECT provider, model,
      SUM(questions_generated) AS questionsGenerated,
      SUM(questions_saved) AS questionsApproved,
      SUM(questions_rejected) AS questionsRejected,
      SUM(duration_ms) AS aiProcessingTime,
      SUM(total_tokens) AS tokenUsage,
      SUM(estimated_cost) AS estimatedAiCost,
      COUNT(*) AS providerUsage
     FROM ai_usage_logs
     ${scope}
     GROUP BY provider, model
     ORDER BY providerUsage DESC`,
    values,
  );

  const questionFilter = questionScope(user, 'question_bank');
  const [questionRows] = await db.execute(
    `SELECT
      SUM(approval_status = 'approved') AS questionsApproved,
      SUM(approval_status = 'rejected') AS questionsRejected,
      SUM(similarity_score >= 0.88) AS duplicateQuestions
     FROM question_bank
     WHERE 1 = 1 ${questionFilter.clause}`,
    questionFilter.values,
  );

  return {
    providerUsage: rows,
    questionQuality: questionRows[0] || {},
  };
}

export async function recordReportView({ userId, reportType, filters }) {
  await db.execute(
    'INSERT INTO user_report_history (user_id, report_type, filters) VALUES (?, ?, ?)',
    [userId, reportType, filters ? JSON.stringify(filters) : null],
  );
}

export async function recordGeneratedReport(payload) {
  await db.execute(
    `INSERT INTO generated_reports
      (uuid, report_type, role_scope, generated_by, filters, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.reportType,
      payload.role,
      payload.userId || null,
      payload.filters ? JSON.stringify(payload.filters) : null,
      JSON.stringify(payload.reportPayload || {}),
    ],
  );
}

export async function recordReportExport(payload) {
  await db.execute(
    `INSERT INTO report_export_history
      (uuid, report_type, export_format, export_scope, requested_by, status, file_name, filters)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.reportType,
      payload.format,
      payload.scope || 'filtered_data',
      payload.userId || null,
      payload.status || 'completed',
      payload.fileName || null,
      payload.filters ? JSON.stringify(payload.filters) : null,
    ],
  );
  await createNotification({
    userId: payload.userId,
    role: payload.role,
    title: 'Report export completed',
    message: `${payload.reportType} report was exported as ${payload.format.toUpperCase()}.`,
    notificationType: 'system',
    sourceModule: 'reports',
    actionUrl: '/notifications',
    metadata: {
      reportType: payload.reportType,
      format: payload.format,
      fileName: payload.fileName,
    },
  });
}

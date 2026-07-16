import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { generateId } from '../utils/idGenerator.js';

const like = (term) => `%${term}%`;

const CATEGORY_ALIASES = {
  learning_materials: 'materials',
  pdf_files: 'materials',
  ppt_files: 'materials',
  doc_files: 'materials',
  videos: 'materials',
  teacher_notes: 'materials',
  completed_topics: 'topics',
  quiz_results: 'quizzes',
};

const MATERIAL_CATEGORY_TYPES = {
  pdf_files: ['pdf'],
  ppt_files: ['ppt'],
  doc_files: ['doc', 'docx'],
  videos: ['video'],
  teacher_notes: ['note'],
};

function normalizeCategory(category) {
  return CATEGORY_ALIASES[category] || category;
}

async function findStudentId(userId) {
  const [rows] = await db.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0]?.id || null;
}

function canSearch(user, category) {
  const normalized = normalizeCategory(category);
  const permissions = {
    users: [ROLES.SUPER_ADMIN],
    admins: [ROLES.SUPER_ADMIN],
    teachers: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    students: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER],
    curriculums: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER],
    subjects: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    lessons: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    materials: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    topics: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    announcements: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    quizzes: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    reports: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
    notifications: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT],
  };

  return permissions[normalized]?.includes(user.role);
}

function categoryMatches(selected, category, aliases = []) {
  if (!selected) return true;
  return selected === category || aliases.includes(selected) || normalizeCategory(selected) === category;
}

function result(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    owner: row.owner,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    actionUrl: row.actionUrl,
    relevance: Number(row.relevance || 0),
  };
}

function addTextSearch(where, params, columns, term) {
  if (!term) return;
  where.push(`(${columns.map((column) => `${column} LIKE ?`).join(' OR ')})`);
  params.push(...columns.map(() => like(term)));
}

function addExactFilter(where, params, column, value) {
  if (value === undefined || value === null || value === '') return;
  where.push(`${column} = ?`);
  params.push(value);
}

function addDateFilters(where, params, column, filters) {
  if (filters.dateFrom) {
    where.push(`${column} >= ?`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    where.push(`${column} <= ?`);
    params.push(`${filters.dateTo} 23:59:59`);
  }
}

function addLimit(params, filters) {
  params.push(Math.min(Number(filters.limit) || 50, 100));
}

async function executeSearch(category, selectedCategory, user, sql, params, results, aliases = []) {
  if (!categoryMatches(selectedCategory, category, aliases)) return;
  if (!canSearch(user, category)) return;
  const [rows] = await db.query(sql, params);
  results.push(...rows.map(result));
}

export async function runRoleSearch(user, filters) {
  const term = String(filters.q || '').trim();
  const selectedCategory = filters.category;
  const results = [];
  const studentId = user.role === ROLES.STUDENT ? await findStudentId(user.id) : null;

  if (categoryMatches(selectedCategory, 'users') && canSearch(user, 'users')) {
    const where = [];
    const params = [];
    addTextSearch(where, params, ['full_name', 'username', 'email', 'role', 'status'], term);
    addExactFilter(where, params, 'role', filters.role);
    addExactFilter(where, params, 'status', filters.status);
    addDateFilters(where, params, 'created_at', filters);
    addLimit(params, filters);
    const [rows] = await db.query(
      `SELECT id, full_name AS title, role AS category, email AS description, username AS owner,
        created_at AS createdAt, updated_at AS updatedAt, CONCAT('/', role, '/profile') AS actionUrl,
        CASE WHEN full_name = ? OR username = ? THEN 100 ELSE 20 END AS relevance
       FROM users
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       LIMIT ?`,
      [term, term, ...params],
    );
    results.push(...rows.map(result));
  }

  await executeSearch(
    'admins',
    selectedCategory,
    user,
    `SELECT a.id, u.full_name AS title, 'admins' AS category,
      COALESCE(a.department, u.email) AS description, u.email AS owner,
      a.created_at AS createdAt, a.updated_at AS updatedAt, '/super-admin/admins' AS actionUrl,
      CASE WHEN u.full_name = ? OR u.username = ? THEN 100 ELSE 30 END AS relevance
     FROM admins a INNER JOIN users u ON u.id = a.user_id
     WHERE (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR a.department LIKE ?)
       AND (? = '' OR a.department LIKE ?)
       AND (? = '' OR u.status = ?)
     LIMIT ?`,
    [
      term,
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      filters.department || '',
      like(filters.department || ''),
      filters.status || '',
      filters.status || '',
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  await executeSearch(
    'teachers',
    selectedCategory,
    user,
    `SELECT t.id, u.full_name AS title, 'teachers' AS category,
      CONCAT_WS(' - ', t.department, t.specialization) AS description, u.email AS owner,
      t.created_at AS createdAt, t.updated_at AS updatedAt, '/admin/teachers' AS actionUrl,
      CASE WHEN u.full_name = ? OR u.username = ? THEN 100 ELSE 30 END AS relevance
     FROM teachers t INNER JOIN users u ON u.id = t.user_id
     WHERE (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR t.department LIKE ? OR t.specialization LIKE ?)
       AND (? = '' OR t.department LIKE ?)
       AND (? = '' OR u.status = ?)
     LIMIT ?`,
    [
      term,
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      like(term),
      filters.department || '',
      like(filters.department || ''),
      filters.status || '',
      filters.status || '',
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  await executeSearch(
    'students',
    selectedCategory,
    user,
    `SELECT s.id, u.full_name AS title, 'students' AS category,
      CONCAT_WS(' - ', s.student_no, s.program, s.enrollment_year) AS description, u.email AS owner,
      s.created_at AS createdAt, s.updated_at AS updatedAt, '/admin/students' AS actionUrl,
      CASE WHEN u.full_name = ? OR s.student_no = ? THEN 100 ELSE 30 END AS relevance
     FROM students s INNER JOIN users u ON u.id = s.user_id
     WHERE (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR s.student_no LIKE ? OR s.program LIKE ?)
       AND (? = '' OR s.program LIKE ?)
       AND (? = '' OR u.status = ?)
       AND (? <> 'teacher' OR EXISTS (
         SELECT 1 FROM quiz_attempts qa
         INNER JOIN quiz_attempt_answers qaa ON qaa.attempt_id = qa.id
         INNER JOIN question_bank qb ON qb.id = qaa.question_id
         WHERE qa.student_id = s.id AND qb.created_by = ?
       ))
     LIMIT ?`,
    [
      term,
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      like(term),
      filters.curriculum || filters.student || '',
      like(filters.curriculum || filters.student || ''),
      filters.status || '',
      filters.status || '',
      user.role,
      user.id,
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  await executeSearch(
    'curriculums',
    selectedCategory,
    user,
    `SELECT c.id, c.title, 'curriculums' AS category, c.description,
      c.code AS owner, c.created_at AS createdAt, c.updated_at AS updatedAt,
      '/admin/curriculums' AS actionUrl, CASE WHEN c.title = ? OR c.code = ? THEN 100 ELSE 30 END AS relevance
     FROM curriculums c
     WHERE (c.title LIKE ? OR c.code LIKE ? OR c.description LIKE ?)
       AND (? = '' OR c.title LIKE ? OR c.code LIKE ?)
       AND (? = '' OR c.is_active = IF(? IN ('active', 'published'), 1, 0))
     LIMIT ?`,
    [
      term,
      term,
      like(term),
      like(term),
      like(term),
      filters.curriculum || '',
      like(filters.curriculum || ''),
      like(filters.curriculum || ''),
      filters.status || '',
      filters.status || '',
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  await executeSearch(
    'subjects',
    selectedCategory,
    user,
    `SELECT co.id, co.title, 'subjects' AS category,
      CONCAT_WS(' - ', cu.title, co.code) AS description, COALESCE(u.full_name, 'Unassigned') AS owner,
      co.created_at AS createdAt, co.updated_at AS updatedAt,
      '/search' AS actionUrl, CASE WHEN co.title = ? OR co.code = ? THEN 100 ELSE 25 END AS relevance
     FROM courses co
     INNER JOIN curriculums cu ON cu.id = co.curriculum_id
     LEFT JOIN teachers t ON t.id = co.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     WHERE (co.title LIKE ? OR co.code LIKE ? OR co.description LIKE ? OR cu.title LIKE ?)
       AND (? = '' OR cu.title LIKE ? OR cu.code LIKE ?)
       AND (? = '' OR co.title LIKE ? OR co.code LIKE ?)
       AND (? <> 'teacher' OR u.id = ?)
     LIMIT ?`,
    [
      term,
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      filters.curriculum || '',
      like(filters.curriculum || ''),
      like(filters.curriculum || ''),
      filters.subject || '',
      like(filters.subject || ''),
      like(filters.subject || ''),
      user.role,
      user.id,
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  await executeSearch(
    'lessons',
    selectedCategory,
    user,
    `SELECT wp.id, wp.topic AS title, 'lessons' AS category,
      CONCAT(co.title, ' - Week ', wp.week_no, ' - ', wp.status) AS description,
      u.full_name AS owner, wp.created_at AS createdAt, wp.updated_at AS updatedAt,
      '/teacher/weekly-plan' AS actionUrl, CASE WHEN wp.topic = ? THEN 100 ELSE 25 END AS relevance
     FROM weekly_teaching_plan wp
     INNER JOIN courses co ON co.id = wp.course_id
     LEFT JOIN teachers t ON t.id = wp.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     WHERE (wp.topic LIKE ? OR wp.objectives LIKE ? OR wp.activities LIKE ? OR co.title LIKE ?)
       AND (? = '' OR co.title LIKE ?)
       AND (? = '' OR wp.week_no = ?)
       AND (? = '' OR wp.topic LIKE ?)
       AND (? = '' OR wp.status = ?)
       AND (? <> 'teacher' OR u.id = ?)
       AND (? <> 'student' OR wp.status IN ('published', 'completed'))
     LIMIT ?`,
    [
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      filters.subject || '',
      like(filters.subject || ''),
      filters.weekNo || '',
      Number(filters.weekNo) || 0,
      filters.topic || '',
      like(filters.topic || ''),
      filters.status || '',
      filters.status || '',
      user.role,
      user.id,
      user.role,
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  const materialTypes = MATERIAL_CATEGORY_TYPES[selectedCategory] || (filters.fileType ? [String(filters.fileType).toLowerCase()] : []);
  const materialTypePlaceholders = materialTypes.length ? materialTypes.map(() => '?').join(', ') : 'NULL';
  await executeSearch(
    'materials',
    selectedCategory,
    user,
    `SELECT m.id, m.title,
      CASE
        WHEN m.material_type = 'pdf' THEN 'pdf_files'
        WHEN m.material_type = 'ppt' THEN 'ppt_files'
        WHEN m.material_type IN ('doc', 'docx') THEN 'doc_files'
        WHEN m.material_type = 'video' THEN 'videos'
        WHEN m.material_type = 'note' THEN 'teacher_notes'
        ELSE 'learning_materials'
      END AS category,
      CONCAT_WS(' - ', m.description, co.title, cu.title) AS description,
      u.full_name AS owner, m.created_at AS createdAt, m.updated_at AS updatedAt,
      CASE WHEN m.material_type = 'video' THEN '/student/videos' WHEN m.material_type = 'note' THEN '/student/notes' ELSE '/student/materials' END AS actionUrl,
      CASE WHEN m.title = ? THEN 100 ELSE 35 END AS relevance
     FROM materials m
     LEFT JOIN courses co ON co.id = m.course_id
     LEFT JOIN curriculums cu ON cu.id = co.curriculum_id
     LEFT JOIN users u ON u.id = m.uploaded_by
     WHERE (m.title LIKE ? OR m.description LIKE ? OR m.material_type LIKE ? OR co.title LIKE ? OR cu.title LIKE ? OR u.full_name LIKE ?)
       AND (? = 0 OR m.material_type IN (${materialTypePlaceholders}))
       AND (? = '' OR cu.title LIKE ? OR cu.code LIKE ?)
       AND (? = '' OR co.title LIKE ? OR co.code LIKE ?)
       AND (? = '' OR u.full_name LIKE ?)
       AND (? = '' OR m.is_published = IF(? IN ('published', 'active'), 1, 0))
       AND (? IS NULL OR DATE(m.created_at) = ?)
       AND (? NOT IN ('teacher', 'student') OR m.is_published = 1 OR m.uploaded_by = ?)
     LIMIT ?`,
    [
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      like(term),
      like(term),
      materialTypes.length,
      ...materialTypes,
      filters.curriculum || '',
      like(filters.curriculum || ''),
      like(filters.curriculum || ''),
      filters.subject || '',
      like(filters.subject || ''),
      like(filters.subject || ''),
      filters.teacher || filters.createdBy || '',
      like(filters.teacher || filters.createdBy || ''),
      filters.status || '',
      filters.status || '',
      filters.uploadDate || null,
      filters.uploadDate || null,
      user.role,
      user.id,
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
    ['learning_materials', 'pdf_files', 'ppt_files', 'doc_files', 'videos', 'teacher_notes'],
  );

  await executeSearch(
    'topics',
    selectedCategory,
    user,
    `SELECT qt.id, qt.topic AS title,
      CASE WHEN qt.status = 'completed' THEN 'completed_topics' ELSE 'topics' END AS category,
      CONCAT(qt.subject, ' - Week ', qt.week_no, ' - ', qt.status) AS description,
      COALESCE(u.full_name, qt.subject) AS owner, qt.created_at AS createdAt, qt.updated_at AS updatedAt,
      '/teacher/completed-topics' AS actionUrl, CASE WHEN qt.topic = ? THEN 100 ELSE 35 END AS relevance
     FROM question_topics qt
     LEFT JOIN users u ON u.id = qt.teacher_id
     LEFT JOIN curriculums cu ON cu.id = qt.curriculum_id
     WHERE (qt.topic LIKE ? OR qt.subject LIKE ? OR qt.status LIKE ? OR cu.title LIKE ?)
       AND (? = '' OR cu.title LIKE ? OR cu.code LIKE ?)
       AND (? = '' OR qt.subject LIKE ?)
       AND (? = '' OR qt.week_no = ?)
       AND (? = '' OR qt.topic LIKE ?)
       AND (? = '' OR qt.status = ?)
       AND (? <> 'teacher' OR qt.teacher_id = ?)
       AND (? <> 'student' OR qt.status = 'completed')
     LIMIT ?`,
    [
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      filters.curriculum || '',
      like(filters.curriculum || ''),
      like(filters.curriculum || ''),
      filters.subject || '',
      like(filters.subject || ''),
      filters.weekNo || '',
      Number(filters.weekNo) || 0,
      filters.topic || '',
      like(filters.topic || ''),
      filters.completedTopic === 'true' ? 'completed' : filters.status || '',
      filters.completedTopic === 'true' ? 'completed' : filters.status || '',
      user.role,
      user.id,
      user.role,
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
    ['completed_topics'],
  );

  await executeSearch(
    'announcements',
    selectedCategory,
    user,
    `SELECT a.id, a.title, 'announcements' AS category, a.body AS description,
      COALESCE(u.full_name, a.audience_role, 'All') AS owner, a.created_at AS createdAt, a.updated_at AS updatedAt,
      '/announcements' AS actionUrl, CASE WHEN a.title = ? THEN 100 ELSE 25 END AS relevance
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE (a.title LIKE ? OR a.body LIKE ? OR a.audience_role LIKE ? OR u.full_name LIKE ?)
       AND (? = '' OR a.status = ?)
       AND (? = '' OR u.full_name LIKE ?)
       AND (a.audience_role IS NULL OR a.audience_role = ? OR ? IN ('super-admin', 'admin'))
       AND (a.status = 'published' OR ? IN ('super-admin', 'admin', 'teacher'))
     LIMIT ?`,
    [
      term,
      like(term),
      like(term),
      like(term),
      like(term),
      filters.status || '',
      filters.status || '',
      filters.createdBy || '',
      like(filters.createdBy || ''),
      user.role,
      user.role,
      user.role,
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  await executeSearch(
    'quizzes',
    selectedCategory,
    user,
    `SELECT qa.id, CONCAT('Quiz ', qa.quiz_number) AS title,
      CASE WHEN qa.status IN ('submitted', 'graded') THEN 'quiz_results' ELSE 'quizzes' END AS category,
      CONCAT_WS(' - ', qa.subject, CONCAT('Score ', COALESCE(qa.percentage, 0), '%'), qa.status) AS description,
      u.full_name AS owner, qa.created_at AS createdAt, qa.updated_at AS updatedAt,
      CONCAT('/student/quiz-result/', qa.quiz_number) AS actionUrl,
      CASE WHEN qa.quiz_number = ? THEN 100 ELSE 20 END AS relevance
     FROM quiz_attempts qa
     INNER JOIN students s ON s.id = qa.student_id
     INNER JOIN users u ON u.id = s.user_id
     WHERE (? = '' OR qa.quiz_number = ? OR qa.subject LIKE ? OR u.full_name LIKE ?)
       AND (? = '' OR qa.quiz_number = ?)
       AND (? = '' OR qa.subject LIKE ?)
       AND (? = '' OR qa.status = ? OR qa.pass_status = ?)
       AND (? <> 'student' OR qa.student_id = ?)
       AND (? <> 'teacher' OR EXISTS (
         SELECT 1 FROM quiz_attempt_answers qaa
         INNER JOIN question_bank qb ON qb.id = qaa.question_id
         WHERE qaa.attempt_id = qa.id AND qb.created_by = ?
       ))
     LIMIT ?`,
    [
      Number(term) || 0,
      term,
      Number(term) || 0,
      like(term),
      like(term),
      filters.quizNumber || '',
      Number(filters.quizNumber) || 0,
      filters.subject || '',
      like(filters.subject || ''),
      filters.status || '',
      filters.status || '',
      filters.status || '',
      user.role,
      studentId || 0,
      user.role,
      user.id,
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
    ['quiz_results'],
  );

  if ((!selectedCategory || selectedCategory === 'quizzes') && canSearch(user, 'quizzes')) {
    const [rows] = await db.query(
      `SELECT qb.id, LEFT(qb.question_text, 120) AS title, 'quizzes' AS category,
        CONCAT_WS(' - ', qb.subject, qb.topic, qb.difficulty, qb.approval_status) AS description,
        COALESCE(u.full_name, 'AI') AS owner, qb.created_at AS createdAt, qb.updated_at AS updatedAt,
        '/teacher/quiz-analytics' AS actionUrl, CASE WHEN qb.question_text LIKE ? THEN 80 ELSE 15 END AS relevance
       FROM question_bank qb
       LEFT JOIN users u ON u.id = qb.created_by
       WHERE (qb.question_text LIKE ? OR qb.topic LIKE ? OR qb.subject LIKE ?)
         AND (? = '' OR qb.difficulty = ?)
         AND (? = '' OR qb.subject LIKE ?)
         AND (? = '' OR qb.week_no = ?)
         AND (? = '' OR qb.topic LIKE ?)
         AND (? = '' OR qb.approval_status = ? OR qb.status = ?)
         AND (? <> 'student')
         AND (? <> 'teacher' OR qb.created_by = ?)
       LIMIT ?`,
      [
        like(term),
        like(term),
        like(term),
        like(term),
        filters.difficulty || '',
        filters.difficulty || '',
        filters.subject || '',
        like(filters.subject || ''),
        filters.weekNo || '',
        Number(filters.weekNo) || 0,
        filters.topic || '',
        like(filters.topic || ''),
        filters.status || '',
        filters.status || '',
        filters.status || '',
        user.role,
        user.role,
        user.id,
        Math.min(Number(filters.limit) || 50, 100),
      ],
    );
    results.push(...rows.map(result));
  }

  await executeSearch(
    'reports',
    selectedCategory,
    user,
    `SELECT r.id, r.title, 'reports' AS category,
      r.report_type AS description, COALESCE(u.full_name, r.report_type) AS owner,
      r.created_at AS createdAt, r.created_at AS updatedAt, '/reports' AS actionUrl,
      CASE WHEN r.title = ? THEN 100 ELSE 20 END AS relevance
     FROM reports r
     LEFT JOIN users u ON u.id = r.generated_by
     WHERE (r.title LIKE ? OR r.report_type LIKE ? OR u.full_name LIKE ?)
       AND (? = '' OR r.report_type LIKE ?)
       AND (? = '' OR u.full_name LIKE ?)
     LIMIT ?`,
    [
      term,
      like(term),
      like(term),
      like(term),
      filters.status || '',
      like(filters.status || ''),
      filters.createdBy || '',
      like(filters.createdBy || ''),
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  await executeSearch(
    'notifications',
    selectedCategory,
    user,
    `SELECT id, title, 'notifications' AS category, message AS description,
      role AS owner, created_at AS createdAt, updated_at AS updatedAt,
      COALESCE(action_url, '/notifications') AS actionUrl, CASE WHEN title = ? THEN 100 ELSE 25 END AS relevance
     FROM notifications
     WHERE user_id = ? AND status = 'active'
       AND (title LIKE ? OR message LIKE ? OR notification_type LIKE ?)
       AND (? = '' OR notification_type LIKE ?)
     LIMIT ?`,
    [
      term,
      user.id,
      like(term),
      like(term),
      like(term),
      filters.status || '',
      like(filters.status || ''),
      Math.min(Number(filters.limit) || 50, 100),
    ],
    results,
  );

  return results;
}

export async function recordSearch({ user, term, category, filters, resultCount, deviceInfo }) {
  await db.execute(
    `INSERT INTO search_history
      (user_id, search_term, search_category, filters, result_count, device_info)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      term,
      category || null,
      filters ? JSON.stringify(filters) : null,
      resultCount,
      deviceInfo ? JSON.stringify(deviceInfo) : null,
    ],
  );
  await db.execute(
    `INSERT INTO search_analytics
      (search_term, search_category, user_id, role, result_count, success)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [term, category || null, user.id, user.role, resultCount, resultCount > 0 ? 1 : 0],
  );
  await db.execute(
    `INSERT INTO popular_searches (search_term, search_count, last_searched_at)
     VALUES (?, 1, NOW())
     ON DUPLICATE KEY UPDATE search_count = search_count + 1, last_searched_at = NOW()`,
    [term],
  );
}

export async function listSearchHistory(userId) {
  const [rows] = await db.execute(
    `SELECT id, search_term AS searchTerm, search_category AS searchCategory,
      filters, result_count AS resultCount, searched_at AS searchedAt
     FROM search_history
     WHERE user_id = ?
     ORDER BY searched_at DESC
     LIMIT 25`,
    [userId],
  );
  return rows;
}

export async function clearSearchHistory(userId) {
  await db.execute('DELETE FROM search_history WHERE user_id = ?', [userId]);
}

export async function listPopularSearches() {
  const [rows] = await db.execute(
    `SELECT search_term AS searchTerm, search_count AS searchCount
     FROM popular_searches
     ORDER BY search_count DESC, last_searched_at DESC
     LIMIT 10`,
  );
  return rows;
}

export async function saveSearch({ userId, name, term, filters, isPinned }) {
  const [resultSet] = await db.execute(
    `INSERT INTO saved_searches (uuid, user_id, name, search_term, filters, is_pinned)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [generateId(), userId, name, term, filters ? JSON.stringify(filters) : null, isPinned ? 1 : 0],
  );
  return resultSet.insertId;
}

export async function listSavedSearches(userId) {
  const [rows] = await db.execute(
    `SELECT id, uuid, name, search_term AS searchTerm, filters, is_pinned AS isPinned,
      created_at AS createdAt, updated_at AS updatedAt
     FROM saved_searches
     WHERE user_id = ?
     ORDER BY is_pinned DESC, updated_at DESC`,
    [userId],
  );
  return rows;
}

export async function updateSavedSearch({ userId, id, payload }) {
  const allowed = {
    name: 'name',
    searchTerm: 'search_term',
    filters: 'filters',
    isPinned: 'is_pinned',
  };
  const entries = Object.entries(payload).filter(([key]) => allowed[key]);
  if (!entries.length) return false;
  const assignments = entries.map(([key]) => `${allowed[key]} = ?`).join(', ');
  const values = entries.map(([key, value]) => {
    if (key === 'filters') return JSON.stringify(value);
    if (key === 'isPinned') return value ? 1 : 0;
    return value;
  });
  const [resultSet] = await db.execute(
    `UPDATE saved_searches SET ${assignments} WHERE id = ? AND user_id = ?`,
    [...values, id, userId],
  );
  return resultSet.affectedRows > 0;
}

export async function deleteSavedSearch({ userId, id }) {
  const [resultSet] = await db.execute('DELETE FROM saved_searches WHERE id = ? AND user_id = ?', [
    id,
    userId,
  ]);
  return resultSet.affectedRows > 0;
}

export async function getSearchAnalytics() {
  const [keywords] = await db.execute(
    `SELECT search_term AS keyword, COUNT(*) AS searches,
      SUM(success = 0) AS noResultSearches,
      ROUND(100 * SUM(success = 1) / NULLIF(COUNT(*), 0), 2) AS successRate
     FROM search_analytics
     GROUP BY search_term
     ORDER BY searches DESC
     LIMIT 20`,
  );
  const [activity] = await db.execute(
    `SELECT role, COUNT(*) AS searches
     FROM search_analytics
     GROUP BY role
     ORDER BY searches DESC`,
  );
  const [topics] = await db.execute(
    `SELECT COALESCE(search_category, 'all') AS category, COUNT(*) AS searches
     FROM search_analytics
     GROUP BY COALESCE(search_category, 'all')
     ORDER BY searches DESC`,
  );
  const [noResults] = await db.execute(
    `SELECT search_term AS keyword, created_at AS searchedAt
     FROM search_analytics
     WHERE success = 0
     ORDER BY created_at DESC
     LIMIT 20`,
  );
  const [viewedMaterials] = await db.execute(
    `SELECT m.title, COUNT(sh.id) AS views
     FROM search_history sh
     INNER JOIN materials m ON JSON_SEARCH(sh.filters, 'one', m.title) IS NOT NULL
     GROUP BY m.id, m.title
     ORDER BY views DESC
     LIMIT 10`,
  );
  return { keywords, activity, topics, noResults, viewedMaterials };
}

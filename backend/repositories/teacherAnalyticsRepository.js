import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';
import { ensureCurriculumManagementSchema } from './curriculumRepository.js';
import { ensureFileAudienceSchema, ensureFileCourseSchema, ensureFileDepartmentSchema } from './fileRepository.js';
import { ensureUserAssignmentSchema } from './userManagementRepository.js';

function isTeacher(user) {
  return user?.role === ROLES.TEACHER;
}

function teacherAttemptScope(user, alias = 'qa') {
  if (!isTeacher(user)) {
    return { clause: '', values: [] };
  }

  return {
    clause: `AND EXISTS (
      SELECT 1
      FROM teachers scoped_teacher
      INNER JOIN teacher_departments scoped_td
        ON scoped_td.teacher_id = scoped_teacher.id
      INNER JOIN student_departments scoped_sd
        ON scoped_sd.department_id = scoped_td.department_id
        AND scoped_sd.student_id = ${alias}.student_id
      WHERE scoped_teacher.user_id = ?
    )`,
    values: [user.id],
  };
}

function teacherQuestionScope(user, alias = 'qb') {
  if (!isTeacher(user)) {
    return { clause: '', values: [] };
  }

  return { clause: `AND ${alias}.created_by = ?`, values: [user.id] };
}

function teacherStudentScope(user, alias = 's') {
  if (!isTeacher(user)) {
    return { clause: '', values: [] };
  }

  return {
    clause: `AND EXISTS (
      SELECT 1
      FROM teachers scoped_teacher
      INNER JOIN teacher_departments scoped_td
        ON scoped_td.teacher_id = scoped_teacher.id
      INNER JOIN student_departments scoped_sd
        ON scoped_sd.department_id = scoped_td.department_id
        AND scoped_sd.student_id = ${alias}.id
      WHERE scoped_teacher.user_id = ?
    )`,
    values: [user.id],
  };
}

function normalizeAudienceRole(value) {
  const role = String(value || '').toLowerCase();
  if (role === 'all_users' || role === 'all') return 'all';
  return role;
}

function pushWeekItem(subject, item) {
  const weekNo = Number(item.weekNo || 0);
  if (!weekNo && item.kind === 'announcement') {
    subject.generalAnnouncements.push(item);
    return;
  }

  let week = subject.weeks.find((entry) => Number(entry.weekNo) === weekNo);
  if (!week) {
    week = { weekNo, files: [], announcements: [] };
    subject.weeks.push(week);
  }

  if (item.kind === 'announcement') {
    week.announcements.push(item);
  } else {
    week.files.push(item);
  }
}

export async function getTeacherLearningHierarchy(user) {
  if (!isTeacher(user)) {
    return { departments: [] };
  }

  await ensureUserAssignmentSchema();
  await ensureCurriculumManagementSchema();
  await ensureFileAudienceSchema();
  await ensureFileDepartmentSchema();
  await ensureFileCourseSchema();

  const [teacherRows] = await db.execute('SELECT id FROM teachers WHERE user_id = ? LIMIT 1', [user.id]);
  const teacherId = teacherRows[0]?.id;

  if (!teacherId) {
    return { departments: [] };
  }

  const [departmentRows] = await db.execute(
    `SELECT DISTINCT d.id, d.name
     FROM teacher_departments td
     INNER JOIN departments d ON d.id = td.department_id
     WHERE td.teacher_id = ?
       AND d.status = 'active'
     ORDER BY d.name ASC`,
    [teacherId],
  );

  if (!departmentRows.length) {
    return { departments: [] };
  }

  const departmentIds = departmentRows.map((department) => Number(department.id));
  const departmentPlaceholders = departmentIds.map(() => '?').join(', ');

  const [curriculumRows] = await db.query(
    `SELECT c.id, c.title AS name, c.code, c.description, c.department_id AS departmentId,
      d.name AS departmentName, c.is_active AS isActive, c.created_at AS createdAt
     FROM curriculums c
     INNER JOIN departments d ON d.id = c.department_id
     WHERE c.department_id IN (${departmentPlaceholders})
       AND c.is_active = 1
     ORDER BY d.name ASC, c.title ASC`,
    departmentIds,
  );

  const curriculumIds = curriculumRows.map((curriculum) => Number(curriculum.id));
  const moduleRows = curriculumIds.length
    ? (
        await db.query(
          `SELECT co.id, co.curriculum_id AS curriculumId, co.title AS name, co.code, co.description,
            co.credit_hours AS creditHours, co.is_active AS isActive, co.created_at AS createdAt
           FROM courses co
           WHERE co.curriculum_id IN (${curriculumIds.map(() => '?').join(', ')})
             AND co.is_active = 1
           ORDER BY co.title ASC`,
          curriculumIds,
        )
      )[0]
    : [];

  const courseIds = moduleRows.map((course) => Number(course.id));
  const fileRows = courseIds.length
    ? (
        await db.query(
          `SELECT DISTINCT f.id, f.original_file_name AS title, f.file_type AS fileType,
            f.file_size AS size, f.course_id AS courseId, f.week_no AS weekNo, f.topic,
            f.description, f.version, f.created_at AS uploadedAt
           FROM files f
           LEFT JOIN file_departments fd ON fd.file_id = f.id
           WHERE f.course_id IN (${courseIds.map(() => '?').join(', ')})
             AND f.status = 'active'
             AND (
               f.uploaded_by = ?
               OR (
                 f.visibility = 'public'
                 AND f.audience IN ('all', 'teacher')
               )
             )
             AND (
               fd.department_id IS NULL
               OR fd.department_id IN (${departmentPlaceholders})
             )
           ORDER BY COALESCE(f.week_no, 0) ASC, f.created_at DESC, f.id DESC`,
          [...courseIds, user.id, ...departmentIds],
        )
      )[0]
    : [];

  const announcementRows = courseIds.length || curriculumIds.length
    ? (
        await db.query(
          `SELECT DISTINCT a.id, a.title, a.body AS content, a.department_id AS departmentId,
            a.curriculum_id AS curriculumId, a.course_id AS courseId, a.week_no AS weekNo,
            a.audience_role AS audienceRole, a.priority, a.publish_at AS uploadedAt, a.created_at AS createdAt
           FROM announcements a
           LEFT JOIN announcement_targets at ON at.announcement_id = a.id
           WHERE a.status = 'published'
             AND (a.publish_at IS NULL OR a.publish_at <= NOW())
             AND (a.expiry_at IS NULL OR a.expiry_at > NOW())
             AND (
               a.audience_role IS NULL
               OR a.audience_role IN ('all_users', 'teacher')
               OR (at.target_type = 'role' AND at.target_id = ?)
               OR at.target_type = 'all_users'
             )
             AND (
               a.department_id IS NULL
               OR a.department_id IN (${departmentPlaceholders})
               OR (at.target_type = 'department' AND at.target_id IN (${departmentPlaceholders}))
             )
             AND (
               a.curriculum_id IS NULL
               OR a.curriculum_id IN (${curriculumIds.length ? curriculumIds.map(() => '?').join(', ') : 'NULL'})
               OR a.course_id IN (${courseIds.length ? courseIds.map(() => '?').join(', ') : 'NULL'})
             )
           ORDER BY COALESCE(a.week_no, 0) ASC, COALESCE(a.publish_at, a.created_at) DESC, a.id DESC`,
          [ROLES.TEACHER, ...departmentIds, ...departmentIds, ...curriculumIds, ...courseIds],
        )
      )[0]
    : [];

  const departments = departmentRows.map((department) => ({
    id: department.id,
    name: department.name,
    fileCount: 0,
    announcementCount: 0,
    curriculums: [],
  }));
  const departmentsById = new Map(departments.map((department) => [Number(department.id), department]));

  curriculumRows.forEach((curriculum) => {
    const department = departmentsById.get(Number(curriculum.departmentId));
    if (!department) return;
    department.curriculums.push({
      id: curriculum.id,
      name: curriculum.name,
      code: curriculum.code || '',
      description: curriculum.description || '',
      fileCount: 0,
      announcementCount: 0,
      subjects: [],
    });
  });

  const curriculumsById = new Map();
  departments.forEach((department) => {
    department.curriculums.forEach((curriculum) => {
      curriculumsById.set(Number(curriculum.id), { curriculum, department });
    });
  });

  moduleRows.forEach((course) => {
    const linked = curriculumsById.get(Number(course.curriculumId));
    if (!linked) return;
    linked.curriculum.subjects.push({
      id: course.id,
      name: course.name,
      code: course.code || '',
      description: course.description || '',
      creditHours: course.creditHours,
      fileCount: 0,
      announcementCount: 0,
      generalAnnouncements: [],
      weeks: [],
    });
  });

  const subjectsById = new Map();
  curriculumsById.forEach((linked) => {
    linked.curriculum.subjects.forEach((subject) => {
      subjectsById.set(Number(subject.id), { subject, curriculum: linked.curriculum, department: linked.department });
    });
  });

  fileRows.forEach((file) => {
    const linked = subjectsById.get(Number(file.courseId));
    if (!linked) return;
    const item = {
      ...file,
      id: `file-${file.id}`,
      rawId: file.id,
      kind: 'file',
      uploadedAt: file.uploadedAt,
    };
    linked.department.fileCount += 1;
    linked.curriculum.fileCount += 1;
    linked.subject.fileCount += 1;
    pushWeekItem(linked.subject, item);
  });

  announcementRows.forEach((announcement) => {
    if (normalizeAudienceRole(announcement.audienceRole) && !['all', ROLES.TEACHER].includes(normalizeAudienceRole(announcement.audienceRole))) {
      return;
    }

    const targetSubjects = [];
    if (announcement.courseId && subjectsById.has(Number(announcement.courseId))) {
      targetSubjects.push(subjectsById.get(Number(announcement.courseId)));
    } else if (announcement.curriculumId && curriculumsById.has(Number(announcement.curriculumId))) {
      curriculumsById.get(Number(announcement.curriculumId)).curriculum.subjects.forEach((subject) => {
        targetSubjects.push({
          subject,
          curriculum: curriculumsById.get(Number(announcement.curriculumId)).curriculum,
          department: curriculumsById.get(Number(announcement.curriculumId)).department,
        });
      });
    } else if (announcement.departmentId && departmentsById.has(Number(announcement.departmentId))) {
      departmentsById.get(Number(announcement.departmentId)).curriculums.forEach((curriculum) => {
        curriculum.subjects.forEach((subject) => targetSubjects.push({ subject, curriculum, department: departmentsById.get(Number(announcement.departmentId)) }));
      });
    } else {
      subjectsById.forEach((subject) => targetSubjects.push(subject));
    }

    targetSubjects.forEach((linked) => {
      const item = {
        ...announcement,
        id: `announcement-${announcement.id}-${linked.id}`,
        rawId: announcement.id,
        kind: 'announcement',
        uploadedAt: announcement.uploadedAt || announcement.createdAt,
      };
      linked.department.announcementCount += 1;
      linked.curriculum.announcementCount += 1;
      linked.subject.announcementCount += 1;
      pushWeekItem(linked.subject, item);
    });
  });

  departments.forEach((department) => {
    department.curriculums.forEach((curriculum) => {
      curriculum.subjects.forEach((subject) => {
        subject.weeks.sort((a, b) => Number(a.weekNo) - Number(b.weekNo));
      });
    });
  });

  return { departments };
}

export async function getDashboardMetrics(user) {
  if (isTeacher(user)) {
    await ensureUserAssignmentSchema();
  }
  const attemptScope = teacherAttemptScope(user, 'qa');
  const questionScope = teacherQuestionScope(user, 'qb');
  const studentScope = teacherStudentScope(user, 's');
  const topicScope = isTeacher(user) ? 'WHERE teacher_id = ?' : '';

  const [attemptRows] = await db.execute(
    `SELECT COUNT(qa.id) AS totalQuizAttempts,
      COALESCE(ROUND(AVG(qa.percentage), 2), 0) AS averageQuizScore,
      COALESCE(MAX(qa.percentage), 0) AS highestScore,
      COALESCE(MIN(qa.percentage), 0) AS lowestScore,
      COALESCE(ROUND(100 * SUM(CASE WHEN qa.pass_status = 'pass' THEN 1 ELSE 0 END) / NULLIF(COUNT(qa.id), 0), 2), 0) AS passRate,
      COUNT(DISTINCT CASE WHEN qa.submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN qa.student_id END) AS activeStudents
     FROM quiz_attempts qa
     WHERE qa.status = 'graded' ${attemptScope.clause}`,
    attemptScope.values,
  );

  const [studentRows] = await db.execute(
    `SELECT COUNT(DISTINCT s.id) AS totalStudents
     FROM students s
     INNER JOIN users u ON u.id = s.user_id
     WHERE u.status = 'active' ${studentScope.clause}`,
    studentScope.values,
  );

  const [topicRows] = await db.execute(
    `SELECT COUNT(*) AS completedTopics FROM question_topics ${topicScope} ${
      topicScope ? 'AND' : 'WHERE'
    } status = 'completed'`,
    isTeacher(user) ? [user.id] : [],
  );

  const [questionRows] = await db.execute(
    `SELECT COUNT(*) AS aiQuestionsAvailable
     FROM question_bank qb
     WHERE qb.approval_status = 'approved'
      AND qb.status = 'approved'
      AND qb.created_by_ai = 1
      ${questionScope.clause}`,
    questionScope.values,
  );

  return {
    ...(attemptRows[0] || {}),
    totalStudents: studentRows[0]?.totalStudents || 0,
    completedTopics: topicRows[0]?.completedTopics || 0,
    aiQuestionsAvailable: questionRows[0]?.aiQuestionsAvailable || 0,
  };
}

export async function listStudentPerformance(user) {
  if (isTeacher(user)) {
    await ensureUserAssignmentSchema();
  }
  const attemptScope = teacherAttemptScope(user, 'qa');
  const studentScope = teacherStudentScope(user, 's');
  const [rows] = await db.execute(
    `SELECT s.id AS studentId, s.student_no AS studentNo, u.full_name AS studentName,
      COALESCE(c.title, 'General Curriculum') AS curriculum,
      COUNT(qa.id) AS quizAttempts,
      COALESCE(ROUND(AVG(qa.percentage), 2), 0) AS averagePercentage,
      COALESCE(MAX(qa.percentage), 0) AS highestScore,
      COALESCE(MIN(qa.percentage), 0) AS lowestScore,
      MAX(qa.submitted_at) AS lastQuizDate,
      CASE
        WHEN COALESCE(AVG(qa.percentage), 0) >= 85 THEN 'excellent'
        WHEN COALESCE(AVG(qa.percentage), 0) >= 70 THEN 'good'
        WHEN COALESCE(AVG(qa.percentage), 0) >= 50 THEN 'needs_review'
        ELSE 'at_risk'
      END AS progressStatus
     FROM students s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN curriculums c ON c.id = s.curriculum_id
     LEFT JOIN quiz_attempts qa
      ON qa.student_id = s.id
      AND qa.status = 'graded' ${attemptScope.clause}
     WHERE u.status = 'active' ${studentScope.clause}
     GROUP BY s.id, s.student_no, u.full_name, c.title
     ORDER BY averagePercentage DESC, quizAttempts DESC`,
    [...attemptScope.values, ...studentScope.values],
  );

  return rows;
}

export async function listQuizAttempts(user, filters = {}) {
  if (isTeacher(user)) {
    await ensureUserAssignmentSchema();
  }
  const scope = teacherAttemptScope(user, 'qa');
  const where = ['qa.status = \'graded\''];
  const values = [];

  if (filters.studentId) {
    where.push('qa.student_id = ?');
    values.push(filters.studentId);
  }

  const [rows] = await db.execute(
    `SELECT qa.id AS attemptId, qa.quiz_number AS quizNumber, qa.submitted_at AS attemptDate,
      s.id AS studentId, s.student_no AS studentNo, u.full_name AS studentName,
      qa.score, qa.percentage, qa.duration_seconds AS durationSeconds,
      qa.pass_status AS passStatus, qa.week_coverage AS weekCoverage,
      GROUP_CONCAT(DISTINCT qb.topic ORDER BY qb.week_no SEPARATOR ', ') AS topicsCovered
     FROM quiz_attempts qa
     INNER JOIN students s ON s.id = qa.student_id
     INNER JOIN users u ON u.id = s.user_id
     INNER JOIN quiz_attempt_answers qaa ON qaa.attempt_id = qa.id
     INNER JOIN question_bank qb ON qb.id = qaa.question_id
     WHERE ${where.join(' AND ')} ${scope.clause}
     GROUP BY qa.id, qa.quiz_number, qa.submitted_at, s.id, s.student_no, u.full_name,
      qa.score, qa.percentage, qa.duration_seconds, qa.pass_status, qa.week_coverage
     ORDER BY qa.submitted_at DESC`,
    [...values, ...scope.values],
  );

  return rows;
}

export async function listAttemptReview(user, attemptId) {
  if (isTeacher(user)) {
    await ensureUserAssignmentSchema();
  }
  const scope = teacherAttemptScope(user, 'qa');
  const [rows] = await db.execute(
    `SELECT qa.quiz_number AS quizNumber, u.full_name AS studentName,
      qaa.question_order AS questionOrder, qaa.randomized_options AS randomizedOptions,
      qaa.selected_answer AS selectedAnswer, qaa.is_correct AS isCorrect,
      qb.question_text AS question, qb.explanation, qb.topic, qb.week_no AS weekNo
     FROM quiz_attempts qa
     INNER JOIN students s ON s.id = qa.student_id
     INNER JOIN users u ON u.id = s.user_id
     INNER JOIN quiz_attempt_answers qaa ON qaa.attempt_id = qa.id
     INNER JOIN question_bank qb ON qb.id = qaa.question_id
     WHERE qa.id = ? ${scope.clause}
     ORDER BY qaa.question_order ASC`,
    [attemptId, ...scope.values],
  );

  return rows;
}

export async function listTopicPerformance(user) {
  const questionScope = teacherQuestionScope(user, 'qb');
  const [rows] = await db.execute(
    `SELECT qb.topic, qb.subject, qb.week_no AS weekNo,
      COUNT(DISTINCT qb.id) AS totalQuestions,
      COALESCE(ROUND(AVG(CASE WHEN qaa.is_correct = 1 THEN 100 ELSE 0 END), 2), 0) AS averageScore,
      COALESCE(ROUND(100 * SUM(CASE WHEN qaa.is_correct = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(qaa.id), 0), 2), 0) AS correctPercentage,
      COALESCE(ROUND(100 * SUM(CASE WHEN qaa.is_correct = 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(qaa.id), 0), 2), 0) AS incorrectPercentage,
      COUNT(DISTINCT CASE WHEN qaa.is_correct = 0 THEN qa.student_id END) AS weakStudents,
      COUNT(DISTINCT CASE WHEN qaa.is_correct = 1 THEN qa.student_id END) AS strongStudents
     FROM question_bank qb
     LEFT JOIN quiz_attempt_answers qaa ON qaa.question_id = qb.id
     LEFT JOIN quiz_attempts qa ON qa.id = qaa.attempt_id AND qa.status = 'graded'
     WHERE qb.approval_status = 'approved' ${questionScope.clause}
     GROUP BY qb.topic, qb.subject, qb.week_no
     ORDER BY incorrectPercentage DESC, qb.week_no ASC`,
    questionScope.values,
  );

  return rows;
}

export async function listWeeklyAnalytics(user) {
  if (isTeacher(user)) {
    await ensureUserAssignmentSchema();
  }
  const questionScope = teacherQuestionScope(user, 'qb');
  const attemptScope = teacherAttemptScope(user, 'qa');
  const [rows] = await db.execute(
    `SELECT qb.week_no AS weekNo,
      COUNT(DISTINCT qb.topic) AS completedTopics,
      COALESCE(ROUND(AVG(qa.percentage), 2), 0) AS averageQuizPercentage,
      COUNT(DISTINCT qa.student_id) AS studentParticipation,
      COUNT(DISTINCT qa.id) AS quizAttempts
     FROM question_bank qb
     LEFT JOIN quiz_attempt_answers qaa ON qaa.question_id = qb.id
     LEFT JOIN quiz_attempts qa ON qa.id = qaa.attempt_id AND qa.status = 'graded' ${attemptScope.clause}
     WHERE qb.week_no IS NOT NULL ${questionScope.clause}
     GROUP BY qb.week_no
     ORDER BY qb.week_no ASC`,
    [...attemptScope.values, ...questionScope.values],
  );

  return rows;
}

export async function getQuestionExposure(user) {
  const questionScope = teacherQuestionScope(user, 'qb');
  const [summaryRows] = await db.execute(
    `SELECT COUNT(DISTINCT qb.id) AS totalQuestions,
      COUNT(DISTINCT CASE WHEN qe.id IS NULL THEN qb.id END) AS questionsNeverUsed,
      COUNT(DISTINCT CASE WHEN qe.exposure_count = 1 THEN qb.id END) AS questionsUsedOnce,
      COUNT(DISTINCT CASE WHEN qe.exposure_count > 1 THEN qb.id END) AS questionsUsedMultipleTimes,
      COALESCE(ROUND(100 * COUNT(DISTINCT CASE WHEN qe.id IS NOT NULL THEN qb.id END) / NULLIF(COUNT(DISTINCT qb.id), 0), 2), 0) AS exposurePercentage
     FROM question_bank qb
     LEFT JOIN question_exposure qe ON qe.question_id = qb.id
     WHERE qb.approval_status = 'approved' ${questionScope.clause}`,
    questionScope.values,
  );

  const [questionRows] = await db.execute(
    `SELECT qb.id AS questionId, qb.topic, qb.difficulty,
      COALESCE(SUM(qe.exposure_count), 0) AS exposureCount,
      MIN(qe.first_seen_at) AS firstSeenAt,
      MAX(qe.last_seen_at) AS lastSeenAt
     FROM question_bank qb
     LEFT JOIN question_exposure qe ON qe.question_id = qb.id
     WHERE qb.approval_status = 'approved' ${questionScope.clause}
     GROUP BY qb.id, qb.topic, qb.difficulty
     ORDER BY exposureCount DESC, qb.id DESC
     LIMIT 100`,
    questionScope.values,
  );

  return {
    summary: summaryRows[0] || {},
    questions: questionRows,
  };
}

export async function getQuestionBankAnalytics(user, filters = {}) {
  const questionScope = teacherQuestionScope(user, 'qb');
  const where = ['1 = 1'];
  const values = [];

  if (filters.curriculumId) {
    where.push('qb.curriculum_id = ?');
    values.push(filters.curriculumId);
  }
  if (filters.subject) {
    where.push('qb.subject = ?');
    values.push(filters.subject);
  }
  if (filters.weekNo) {
    where.push('qb.week_no = ?');
    values.push(filters.weekNo);
  }
  if (filters.topic) {
    where.push('qb.topic = ?');
    values.push(filters.topic);
  }
  if (filters.difficulty) {
    where.push('qb.difficulty = ?');
    values.push(filters.difficulty);
  }

  const [rows] = await db.execute(
    `SELECT COUNT(*) AS totalQuestions,
      SUM(CASE WHEN qb.difficulty = 'easy' THEN 1 ELSE 0 END) AS easyQuestions,
      SUM(CASE WHEN qb.difficulty = 'medium' THEN 1 ELSE 0 END) AS mediumQuestions,
      SUM(CASE WHEN qb.difficulty = 'hard' THEN 1 ELSE 0 END) AS hardQuestions,
      SUM(CASE WHEN qb.approval_status = 'approved' THEN 1 ELSE 0 END) AS approvedQuestions,
      SUM(CASE WHEN qb.status = 'archived' THEN 1 ELSE 0 END) AS archivedQuestions,
      SUM(CASE WHEN qb.similarity_score >= 0.88 THEN 1 ELSE 0 END) AS duplicateQuestionsDetected,
      SUM(CASE WHEN qb.created_by_ai = 1 THEN 1 ELSE 0 END) AS aiGeneratedQuestions
     FROM question_bank qb
     WHERE ${where.join(' AND ')} ${questionScope.clause}`,
    [...values, ...questionScope.values],
  );

  return rows[0] || {};
}

export async function listLeaderboard(user) {
  if (isTeacher(user)) {
    await ensureUserAssignmentSchema();
  }
  const scope = teacherAttemptScope(user, 'qa');
  const [rows] = await db.execute(
    `SELECT RANK() OVER (ORDER BY AVG(qa.percentage) DESC, MAX(qa.percentage) DESC) AS rankNo,
      s.id AS studentId, s.student_no AS studentNo, u.full_name AS studentName,
      ROUND(AVG(qa.percentage), 2) AS averagePercentage,
      COUNT(qa.id) AS totalQuizAttempts,
      MAX(qa.percentage) AS highestScore
     FROM quiz_attempts qa
     INNER JOIN students s ON s.id = qa.student_id
     INNER JOIN users u ON u.id = s.user_id
     WHERE qa.status = 'graded' ${scope.clause}
     GROUP BY s.id, s.student_no, u.full_name
     ORDER BY averagePercentage DESC, highestScore DESC
     LIMIT 50`,
    scope.values,
  );

  return rows;
}

export async function listRecentStudentActivity(user, limit = 5) {
  if (isTeacher(user)) {
    await ensureUserAssignmentSchema();
  }
  const scope = teacherAttemptScope(user, 'qa');
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const [rows] = await db.query(
    `SELECT qa.id AS attemptId, qa.quiz_number AS quizNumber,
      qa.submitted_at AS activityDate, qa.percentage, qa.pass_status AS passStatus,
      qa.subject, s.id AS studentId, s.student_no AS studentNo,
      u.full_name AS studentName
     FROM quiz_attempts qa
     INNER JOIN students s ON s.id = qa.student_id
     INNER JOIN users u ON u.id = s.user_id
     WHERE qa.status = 'graded' ${scope.clause}
     ORDER BY qa.submitted_at DESC, qa.id DESC
     LIMIT ?`,
    [...scope.values, safeLimit],
  );

  return rows;
}

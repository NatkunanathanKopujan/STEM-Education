import { db } from '../config/database.js';
import { ROLES } from '../config/roles.js';

function isTeacher(user) {
  return user?.role === ROLES.TEACHER;
}

function teacherAttemptScope(user, alias = 'qa') {
  if (!isTeacher(user)) {
    return { clause: '', values: [] };
  }

  return {
    clause: `AND EXISTS (
      SELECT 1 FROM quiz_attempt_answers scoped_answers
      INNER JOIN question_bank scoped_questions ON scoped_questions.id = scoped_answers.question_id
      WHERE scoped_answers.attempt_id = ${alias}.id
        AND scoped_questions.created_by = ?
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

export async function getDashboardMetrics(user) {
  const attemptScope = teacherAttemptScope(user, 'qa');
  const questionScope = teacherQuestionScope(user, 'qb');
  const topicScope = isTeacher(user) ? 'WHERE teacher_id = ?' : '';

  const [attemptRows] = await db.execute(
    `SELECT COUNT(DISTINCT qa.student_id) AS totalStudents,
      COUNT(qa.id) AS totalQuizAttempts,
      COALESCE(ROUND(AVG(qa.percentage), 2), 0) AS averageQuizScore,
      COALESCE(MAX(qa.percentage), 0) AS highestScore,
      COALESCE(MIN(qa.percentage), 0) AS lowestScore,
      COALESCE(ROUND(100 * SUM(CASE WHEN qa.pass_status = 'pass' THEN 1 ELSE 0 END) / NULLIF(COUNT(qa.id), 0), 2), 0) AS passRate,
      COUNT(DISTINCT CASE WHEN qa.submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN qa.student_id END) AS activeStudents
     FROM quiz_attempts qa
     WHERE qa.status = 'graded' ${attemptScope.clause}`,
    attemptScope.values,
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
     WHERE qb.approval_status = 'approved' AND qb.status = 'approved' ${questionScope.clause}`,
    questionScope.values,
  );

  return {
    ...(attemptRows[0] || {}),
    completedTopics: topicRows[0]?.completedTopics || 0,
    aiQuestionsAvailable: questionRows[0]?.aiQuestionsAvailable || 0,
  };
}

export async function listStudentPerformance(user) {
  const scope = teacherAttemptScope(user, 'qa');
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
     FROM quiz_attempts qa
     INNER JOIN students s ON s.id = qa.student_id
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN curriculums c ON c.id = qa.curriculum_id
     WHERE qa.status = 'graded' ${scope.clause}
     GROUP BY s.id, s.student_no, u.full_name, c.title
     ORDER BY averagePercentage DESC, quizAttempts DESC`,
    scope.values,
  );

  return rows;
}

export async function listQuizAttempts(user, filters = {}) {
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
  const questionScope = teacherQuestionScope(user, 'qb');
  const [rows] = await db.execute(
    `SELECT qb.week_no AS weekNo,
      COUNT(DISTINCT qb.topic) AS completedTopics,
      COALESCE(ROUND(AVG(qa.percentage), 2), 0) AS averageQuizPercentage,
      COUNT(DISTINCT qa.student_id) AS studentParticipation,
      COUNT(DISTINCT qa.id) AS quizAttempts
     FROM question_bank qb
     LEFT JOIN quiz_attempt_answers qaa ON qaa.question_id = qb.id
     LEFT JOIN quiz_attempts qa ON qa.id = qaa.attempt_id AND qa.status = 'graded'
     WHERE qb.week_no IS NOT NULL ${questionScope.clause}
     GROUP BY qb.week_no
     ORDER BY qb.week_no ASC`,
    questionScope.values,
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

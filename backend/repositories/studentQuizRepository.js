import { db } from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

const attemptSelect = `SELECT qa.id, qa.uuid, qa.student_id AS studentId, qa.course_id AS courseId,
  qa.curriculum_id AS curriculumId, c.title AS curriculum, qa.subject, qa.quiz_number AS quizNumber,
  qa.week_coverage AS weekCoverage, qa.started_at AS startedAt, qa.submitted_at AS submittedAt,
  qa.score, qa.percentage, qa.duration_seconds AS durationSeconds, qa.pass_status AS passStatus,
  qa.reuse_notice AS reuseNotice, qa.status, qa.created_at AS createdAt
 FROM quiz_attempts qa
 LEFT JOIN curriculums c ON c.id = qa.curriculum_id`;

const answerSelect = `SELECT qaa.id, qaa.attempt_id AS attemptId, qaa.question_id AS questionId,
  qaa.quiz_number AS quizNumber, qaa.question_order AS questionOrder,
  qaa.randomized_options AS randomizedOptions, qaa.selected_answer AS selectedAnswer,
  qaa.is_correct AS isCorrect, qaa.answered_at AS answeredAt,
  qb.question_text AS question, qb.difficulty, qb.category, qb.subject, qb.week_no AS weekNo,
  qb.topic, qb.explanation, qb.marks
 FROM quiz_attempt_answers qaa
 INNER JOIN question_bank qb ON qb.id = qaa.question_id`;

export async function findStudentByUserId(userId) {
  const [rows] = await db.execute(
    `SELECT s.id, s.user_id AS userId, s.student_no AS studentNo, u.full_name AS fullName,
      u.email, u.username
     FROM students s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.user_id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
}

export async function findActiveAttempt(studentId) {
  const [rows] = await db.execute(
    `${attemptSelect}
     WHERE qa.student_id = ? AND qa.status = 'started'
     ORDER BY qa.started_at DESC, qa.id DESC
     LIMIT 1`,
    [studentId],
  );

  return rows[0] || null;
}

export async function getNextQuizNumber(studentId) {
  const [rows] = await db.execute(
    'SELECT COALESCE(MAX(quiz_number), 0) + 1 AS nextQuizNumber FROM quiz_attempts WHERE student_id = ?',
    [studentId],
  );

  return rows[0]?.nextQuizNumber || 1;
}

export async function listEligibleQuestions(filters = {}) {
  const where = [
    "qb.approval_status = 'approved'",
    "qb.status = 'approved'",
    'qb.option_a IS NOT NULL',
    'qb.option_b IS NOT NULL',
    'qb.option_c IS NOT NULL',
    'qb.option_d IS NOT NULL',
    'qb.correct_answer IS NOT NULL',
    `EXISTS (
      SELECT 1 FROM question_topics qt
      WHERE qt.status = 'completed'
        AND (qt.curriculum_id <=> qb.curriculum_id)
        AND (qt.course_id <=> qb.course_id)
        AND qt.subject = qb.subject
        AND qt.week_no = qb.week_no
        AND qt.topic = qb.topic
    )`,
    `EXISTS (
      SELECT 1 FROM ai_knowledge_base kb
      WHERE kb.status = 'active'
        AND (kb.curriculum_id <=> qb.curriculum_id)
        AND (kb.course_id <=> qb.course_id)
        AND kb.subject = qb.subject
        AND kb.week_no = qb.week_no
        AND kb.topic = qb.topic
    )`,
  ];
  const values = [];

  if (filters.curriculumId) {
    where.push('qb.curriculum_id = ?');
    values.push(filters.curriculumId);
  }

  if (filters.courseId) {
    where.push('qb.course_id = ?');
    values.push(filters.courseId);
  }

  if (filters.subject) {
    where.push('qb.subject = ?');
    values.push(filters.subject);
  }

  const [rows] = await db.execute(
    `SELECT qb.id, qb.uuid, qb.curriculum_id AS curriculumId, qb.course_id AS courseId,
      c.title AS curriculum, qb.subject, qb.week_no AS weekNo, qb.topic, qb.difficulty,
      qb.category, qb.question_text AS question, qb.option_a AS optionA, qb.option_b AS optionB,
      qb.option_c AS optionC, qb.option_d AS optionD, qb.correct_answer AS correctAnswer,
      qb.explanation, qb.marks
     FROM question_bank qb
     LEFT JOIN curriculums c ON c.id = qb.curriculum_id
     WHERE ${where.join(' AND ')}
     ORDER BY RAND()`,
    values,
  );

  return rows;
}

export async function listStudentQuestionIds(studentId) {
  const [rows] = await db.execute(
    'SELECT DISTINCT question_id AS questionId FROM question_exposure WHERE student_id = ?',
    [studentId],
  );

  return rows.map((row) => row.questionId);
}

export async function recordQuestionExposure({ studentId, questionId, quizNumber }) {
  await db.execute(
    `INSERT INTO question_exposure
      (student_id, question_id, quiz_number, exposure_count, first_seen_at, last_seen_at)
     VALUES (?, ?, ?, 1, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
      quiz_number = VALUES(quiz_number),
      exposure_count = exposure_count + 1,
      last_seen_at = NOW()`,
    [studentId, questionId, quizNumber],
  );
}

export async function createAttempt(payload) {
  const [result] = await db.execute(
    `INSERT INTO quiz_attempts
      (uuid, student_id, course_id, curriculum_id, subject, quiz_number, week_coverage,
       started_at, reuse_notice, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'started')`,
    [
      generateId(),
      payload.studentId,
      payload.courseId || null,
      payload.curriculumId || null,
      payload.subject || null,
      payload.quizNumber,
      payload.weekCoverage ? JSON.stringify(payload.weekCoverage) : null,
      payload.reuseNotice ? 1 : 0,
    ],
  );

  return result.insertId;
}

export async function createAttemptAnswer(payload) {
  await db.execute(
    `INSERT INTO quiz_attempt_answers
      (attempt_id, question_id, quiz_number, question_order, randomized_options)
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.attemptId,
      payload.questionId,
      payload.quizNumber,
      payload.questionOrder,
      JSON.stringify(payload.randomizedOptions),
    ],
  );
}

export async function findAttemptForStudent({ studentId, attemptId, quizNumber }) {
  const values = [studentId];
  const where = ['qa.student_id = ?'];

  if (attemptId) {
    where.push('qa.id = ?');
    values.push(attemptId);
  }

  if (quizNumber) {
    where.push('qa.quiz_number = ?');
    values.push(quizNumber);
  }

  const [rows] = await db.execute(`${attemptSelect} WHERE ${where.join(' AND ')} LIMIT 1`, values);
  return rows[0] || null;
}

export async function listAttemptAnswers(attemptId) {
  const [rows] = await db.execute(
    `${answerSelect}
     WHERE qaa.attempt_id = ?
     ORDER BY qaa.question_order ASC`,
    [attemptId],
  );

  return rows;
}

export async function saveAnswer({ attemptId, questionId, selectedAnswer }) {
  const [result] = await db.execute(
    `UPDATE quiz_attempt_answers
     SET selected_answer = ?, answered_at = NOW()
     WHERE attempt_id = ? AND question_id = ?`,
    [selectedAnswer, attemptId, questionId],
  );

  return result.affectedRows > 0;
}

export async function markAnswerCorrectness({ answerId, isCorrect }) {
  await db.execute('UPDATE quiz_attempt_answers SET is_correct = ? WHERE id = ?', [
    isCorrect ? 1 : 0,
    answerId,
  ]);
}

export async function submitAttempt(payload) {
  await db.execute(
    `UPDATE quiz_attempts
     SET submitted_at = NOW(), score = ?, percentage = ?, duration_seconds = ?,
      pass_status = ?, status = 'graded'
     WHERE id = ? AND student_id = ? AND status = 'started'`,
    [
      payload.score,
      payload.percentage,
      payload.durationSeconds,
      payload.passStatus,
      payload.attemptId,
      payload.studentId,
    ],
  );
}

export async function createQuestionHistory(payload) {
  await db.execute(
    `INSERT IGNORE INTO student_question_history
      (student_id, quiz_number, attempt_id, question_id, topic, curriculum_id,
       student_answer, is_correct, marks_awarded)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.studentId,
      payload.quizNumber,
      payload.attemptId,
      payload.questionId,
      payload.topic || null,
      payload.curriculumId || null,
      payload.studentAnswer || null,
      payload.isCorrect ? 1 : 0,
      payload.marksAwarded,
    ],
  );
}

export async function createQuizResult(payload) {
  await db.execute(
    `INSERT INTO quiz_results
      (attempt_id, student_id, quiz_number, correct_answers, wrong_answers, score,
       percentage, duration_seconds, pass_status, completed_topics, review_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      correct_answers = VALUES(correct_answers),
      wrong_answers = VALUES(wrong_answers),
      score = VALUES(score),
      percentage = VALUES(percentage),
      duration_seconds = VALUES(duration_seconds),
      pass_status = VALUES(pass_status),
      completed_topics = VALUES(completed_topics)`,
    [
      payload.attemptId,
      payload.studentId,
      payload.quizNumber,
      payload.correctAnswers,
      payload.wrongAnswers,
      payload.score,
      payload.percentage,
      payload.durationSeconds,
      payload.passStatus,
      JSON.stringify(payload.completedTopics),
      payload.reviewEnabled ? 1 : 0,
    ],
  );
}

export async function createStudentNotification(payload) {
  await db.execute(
    `INSERT INTO student_notifications (student_id, title, message, metadata)
     VALUES (?, ?, ?, ?)`,
    [
      payload.studentId,
      payload.title,
      payload.message,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );

  const [students] = await db.execute('SELECT user_id AS userId FROM students WHERE id = ? LIMIT 1', [
    payload.studentId,
  ]);
  const userId = students[0]?.userId;

  if (userId) {
    await db.execute(
      `INSERT INTO notifications
        (uuid, user_id, role, title, message, notification_type, priority, source_module,
         action_url, metadata)
       VALUES (?, ?, 'student', ?, ?, 'quiz', 'important', 'ai_quiz', ?, ?)`,
      [
        generateId(),
        userId,
        payload.title,
        payload.message,
        payload.metadata?.quizNumber ? `/student/quiz-result/${payload.metadata.quizNumber}` : null,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
      ],
    );
  }
}

export async function listQuizHistory(studentId) {
  const [rows] = await db.execute(
    `SELECT qr.quiz_number AS quizNumber, qr.correct_answers AS correctAnswers,
      qr.wrong_answers AS wrongAnswers, qr.score, qr.percentage,
      qr.duration_seconds AS durationSeconds, qr.pass_status AS passStatus,
      qr.completed_at AS completedAt, qa.subject, qa.week_coverage AS weekCoverage
     FROM quiz_results qr
     INNER JOIN quiz_attempts qa ON qa.id = qr.attempt_id
     WHERE qr.student_id = ?
     ORDER BY qr.quiz_number DESC`,
    [studentId],
  );

  return rows;
}

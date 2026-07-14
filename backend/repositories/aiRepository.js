import { db } from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

export async function findCompletedTopic({ curriculumId, courseId, subject, weekNo, topic }) {
  const [rows] = await db.execute(
    `SELECT id, status FROM question_topics
     WHERE (curriculum_id <=> ?) AND (course_id <=> ?) AND subject = ? AND week_no = ? AND topic = ?
     LIMIT 1`,
    [curriculumId || null, courseId || null, subject, weekNo, topic],
  );

  return rows[0] || null;
}

export async function upsertTopicStatus({
  curriculumId,
  courseId,
  subject,
  weekNo,
  topic,
  status,
  teacherId,
}) {
  await db.execute(
    `INSERT INTO question_topics
      (uuid, curriculum_id, course_id, subject, week_no, topic, status, completed_at, teacher_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, IF(? = 'completed', NOW(), NULL), ?)
     ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      completed_at = IF(VALUES(status) = 'completed', COALESCE(completed_at, NOW()), NULL),
      teacher_id = VALUES(teacher_id)`,
    [
      generateId(),
      curriculumId || null,
      courseId || null,
      subject,
      weekNo,
      topic,
      status,
      status,
      teacherId || null,
    ],
  );
}

export async function findKnowledgeByHash(contentHash) {
  const [rows] = await db.execute(
    'SELECT id, uuid, version, status FROM ai_knowledge_base WHERE content_hash = ? LIMIT 1',
    [contentHash],
  );
  return rows[0] || null;
}

export async function createKnowledgeEntry(payload) {
  const [result] = await db.execute(
    `INSERT INTO ai_knowledge_base
      (uuid, material_id, curriculum_id, course_id, teacher_id, subject, week_no, topic,
       extracted_text, content_hash, source_type, ai_version, version, status, uploaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      generateId(),
      payload.materialId || null,
      payload.curriculumId || null,
      payload.courseId || null,
      payload.teacherId || null,
      payload.subject,
      payload.weekNo,
      payload.topic,
      payload.extractedText,
      payload.contentHash,
      payload.sourceType,
      payload.aiVersion || 'foundation-v1',
      payload.version || 1,
      payload.status || 'active',
    ],
  );
  return result.insertId;
}

export async function listKnowledge({ limit = 50, offset = 0 } = {}) {
  const [rows] = await db.execute(
    `SELECT id, uuid, curriculum_id AS curriculumId, course_id AS courseId, teacher_id AS teacherId,
      subject, week_no AS weekNo, topic, source_type AS sourceType, ai_version AS aiVersion,
      version, status, uploaded_at AS uploadedAt, created_at AS createdAt
     FROM ai_knowledge_base
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows;
}

export async function listKnowledgeForTopic({ curriculumId, courseId, subject, weekNo, topic }) {
  const [rows] = await db.execute(
    `SELECT id, uuid, curriculum_id AS curriculumId, course_id AS courseId, teacher_id AS teacherId,
      subject, week_no AS weekNo, topic, extracted_text AS extractedText,
      source_type AS sourceType, ai_version AS aiVersion, version, status
     FROM ai_knowledge_base
     WHERE status = 'active'
       AND (curriculum_id <=> ?)
       AND (course_id <=> ?)
       AND subject = ?
       AND week_no = ?
       AND topic = ?
     ORDER BY created_at DESC`,
    [curriculumId || null, courseId || null, subject, weekNo, topic],
  );
  return rows;
}

const questionSelect = `SELECT id, uuid, curriculum_id AS curriculumId, course_id AS courseId,
  subject, week_no AS weekNo, topic, difficulty, category, question_text AS question,
  option_a AS optionA, option_b AS optionB, option_c AS optionC, option_d AS optionD,
  correct_answer AS correctAnswer, explanation, similarity_score AS similarityScore,
  approval_status AS approvalStatus, created_by_ai AS createdByAi, approved_by AS approvedBy,
  generated_at AS generatedAt, ai_version AS aiVersion, status, created_at AS createdAt,
  updated_at AS updatedAt FROM question_bank`;

export async function listQuestions({ limit = 50, offset = 0, filters = {} } = {}) {
  const where = [];
  const values = [];

  if (filters.curriculumId) {
    where.push('curriculum_id = ?');
    values.push(filters.curriculumId);
  }

  if (filters.subject) {
    where.push('subject = ?');
    values.push(filters.subject);
  }

  if (filters.weekNo) {
    where.push('week_no = ?');
    values.push(filters.weekNo);
  }

  if (filters.topic) {
    where.push('topic = ?');
    values.push(filters.topic);
  }

  if (filters.difficulty) {
    where.push('difficulty = ?');
    values.push(filters.difficulty);
  }

  if (filters.teacherId) {
    where.push('created_by = ?');
    values.push(filters.teacherId);
  }

  if (filters.approvalStatus) {
    where.push('approval_status = ?');
    values.push(filters.approvalStatus);
  }

  if (filters.createdDate) {
    where.push('DATE(created_at) = ?');
    values.push(filters.createdDate);
  }

  const [rows] = await db.execute(
    `${questionSelect}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
  return rows;
}

export async function findQuestionById(id) {
  const [rows] = await db.execute(`${questionSelect} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function createQuestion(payload) {
  const [result] = await db.execute(
    `INSERT INTO question_bank
      (uuid, curriculum_id, course_id, subject, week_no, topic, created_by, difficulty,
       category, question_text, option_a, option_b, option_c, option_d, correct_answer,
       explanation, similarity_score, approval_status, created_by_ai, ai_version, status, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      generateId(),
      payload.curriculumId || null,
      payload.courseId || null,
      payload.subject,
      payload.weekNo,
      payload.topic,
      payload.createdBy || null,
      payload.difficulty,
      payload.category,
      payload.question,
      payload.optionA,
      payload.optionB,
      payload.optionC,
      payload.optionD,
      payload.correctAnswer,
      payload.explanation,
      payload.similarityScore ?? null,
      payload.approvalStatus || 'pending',
      payload.createdByAi ?? 1,
      payload.aiVersion,
      payload.status || 'draft',
    ],
  );
  return result.insertId;
}

export async function updateQuestion(id, payload) {
  const allowed = {
    difficulty: 'difficulty',
    category: 'category',
    question: 'question_text',
    optionA: 'option_a',
    optionB: 'option_b',
    optionC: 'option_c',
    optionD: 'option_d',
    correctAnswer: 'correct_answer',
    explanation: 'explanation',
    approvalStatus: 'approval_status',
    approvedBy: 'approved_by',
    status: 'status',
  };
  const entries = Object.entries(payload).filter(([key]) => allowed[key]);

  if (!entries.length) {
    return false;
  }

  const assignments = entries.map(([key]) => `${allowed[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);

  await db.execute(`UPDATE question_bank SET ${assignments} WHERE id = ?`, [...values, id]);
  return true;
}

export async function deleteQuestionById(id) {
  await db.execute('DELETE FROM question_bank WHERE id = ?', [id]);
}

export async function listGenerationLogs({ limit = 50, offset = 0 } = {}) {
  const [rows] = await db.execute(
    `SELECT id, uuid, event_type AS eventType, teacher_id AS teacherId,
      curriculum_id AS curriculumId, course_id AS courseId, material_id AS materialId,
      topic, message, metadata, created_at AS createdAt
     FROM question_generation_logs
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  return rows;
}

export async function listTopics() {
  const [rows] = await db.execute(
    `SELECT id, uuid, curriculum_id AS curriculumId, course_id AS courseId, subject,
      week_no AS weekNo, topic, status, completed_at AS completedAt, teacher_id AS teacherId
     FROM question_topics
     ORDER BY week_no ASC, topic ASC`,
  );
  return rows;
}

export async function createProcessingLog(payload) {
  await db.execute(
    `INSERT INTO question_generation_logs
      (uuid, event_type, teacher_id, curriculum_id, course_id, material_id, topic, message, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.eventType,
      payload.teacherId || null,
      payload.curriculumId || null,
      payload.courseId || null,
      payload.materialId || null,
      payload.topic || null,
      payload.message,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
}

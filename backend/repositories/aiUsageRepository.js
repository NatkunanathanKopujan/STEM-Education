import { db } from '../config/database.js';
import { generateId } from '../utils/idGenerator.js';

export async function createAiUsageLog(payload) {
  await db.execute(
    `INSERT INTO ai_usage_logs
      (uuid, provider, model, teacher_id, curriculum_id, course_id, subject, topic, week_no,
       prompt_id, started_at, ended_at, duration_ms, prompt_tokens, completion_tokens, total_tokens,
       estimated_cost, questions_generated, questions_rejected, questions_saved, status,
       error_message, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      payload.provider,
      payload.model,
      payload.teacherId || null,
      payload.curriculumId || null,
      payload.courseId || null,
      payload.subject || null,
      payload.topic || null,
      payload.weekNo || null,
      payload.promptId || null,
      payload.startedAt || null,
      payload.endedAt || null,
      payload.durationMs || 0,
      payload.promptTokens || 0,
      payload.completionTokens || 0,
      payload.totalTokens || 0,
      payload.estimatedCost || 0,
      payload.questionsGenerated || 0,
      payload.questionsRejected || 0,
      payload.questionsSaved || 0,
      payload.status || 'success',
      payload.errorMessage || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ],
  );
}

export async function updateLatestAiUsageOutcome(payload) {
  const [rows] = await db.execute(
    `SELECT id FROM ai_usage_logs
     WHERE provider = ? AND teacher_id <=> ? AND topic <=> ? AND week_no <=> ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [
      payload.provider,
      payload.teacherId || null,
      payload.topic || null,
      payload.weekNo || null,
    ],
  );

  if (!rows[0]) {
    return false;
  }

  await db.execute(
    `UPDATE ai_usage_logs
     SET questions_saved = ?, questions_rejected = ?
     WHERE id = ?`,
    [payload.questionsSaved || 0, payload.questionsRejected || 0, rows[0].id],
  );

  return true;
}

export async function listAiUsageLogs({ limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const [rows] = await db.query(
    `SELECT id, uuid, provider, model, teacher_id AS teacherId, curriculum_id AS curriculumId,
      course_id AS courseId, subject, topic, week_no AS weekNo, prompt_id AS promptId,
      started_at AS startedAt, ended_at AS endedAt, duration_ms AS durationMs,
      prompt_tokens AS promptTokens, completion_tokens AS completionTokens,
      total_tokens AS totalTokens, estimated_cost AS estimatedCost,
      questions_generated AS questionsGenerated, questions_rejected AS questionsRejected,
      questions_saved AS questionsSaved, status, error_message AS errorMessage, metadata, created_at AS createdAt
     FROM ai_usage_logs
     ORDER BY created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
  );

  return rows;
}

export async function getAiCostSummary() {
  const [rows] = await db.execute(
    `SELECT provider,
      COUNT(*) AS totalRequests,
      SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) AS dailyRequests,
      SUM(CASE WHEN YEAR(created_at) = YEAR(CURRENT_DATE) AND MONTH(created_at) = MONTH(CURRENT_DATE) THEN 1 ELSE 0 END) AS monthlyRequests,
      COALESCE(SUM(total_tokens), 0) AS estimatedTokenUsage,
      COALESCE(SUM(estimated_cost), 0) AS estimatedCost
     FROM ai_usage_logs
     GROUP BY provider
     ORDER BY totalRequests DESC`,
  );

  const totals = rows.reduce(
    (summary, row) => ({
      totalRequests: summary.totalRequests + Number(row.totalRequests || 0),
      dailyRequests: summary.dailyRequests + Number(row.dailyRequests || 0),
      monthlyRequests: summary.monthlyRequests + Number(row.monthlyRequests || 0),
      estimatedTokenUsage: summary.estimatedTokenUsage + Number(row.estimatedTokenUsage || 0),
      estimatedCost: summary.estimatedCost + Number(row.estimatedCost || 0),
    }),
    {
      totalRequests: 0,
      dailyRequests: 0,
      monthlyRequests: 0,
      estimatedTokenUsage: 0,
      estimatedCost: 0,
    },
  );

  return { totals, providers: rows };
}

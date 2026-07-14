import { AppError } from '../../utils/appError.js';
import {
  createProcessingLog,
  createQuestion,
  deleteQuestionById,
  findCompletedTopic,
  findQuestionById,
  listGenerationLogs,
  listKnowledgeForTopic,
  listQuestions,
  updateQuestion,
} from '../../repositories/aiRepository.js';
import { updateLatestAiUsageOutcome } from '../../repositories/aiUsageRepository.js';
import { generateMcqQuestionsWithAi } from './aiServiceManager.js';
import { getAiProvider } from './providers/aiProviderFactory.js';
import { findDuplicateQuestion } from './duplicateDetectionService.js';
import { validateGeneratedQuestion } from './questionValidationService.js';
import { performanceMetricsService } from '../performanceMetricsService.js';

const defaultDifficultyConfig = {
  easy: 3,
  medium: 3,
  hard: 2,
};

export async function generateQuestions(payload) {
  const startedAt = Date.now();
  const topic = await findCompletedTopic(payload);

  if (!topic || topic.status !== 'completed') {
    throw new AppError('Questions can only be generated from completed topics', 422);
  }

  const knowledgeItems = await listKnowledgeForTopic(payload);

  if (!knowledgeItems.length) {
    throw new AppError('Missing source material for this completed topic', 404);
  }

  const existingQuestions = await listQuestions({
    limit: 500,
    filters: {
      curriculumId: payload.curriculumId,
      subject: payload.subject,
      weekNo: payload.weekNo,
      topic: payload.topic,
    },
  });
  const approvedQuestions = existingQuestions.filter(
    (question) => question.approvalStatus === 'approved',
  );

  if (approvedQuestions.length && !payload.forceRegenerate) {
    throw new AppError('Approved questions already exist for this topic', 409);
  }

  const provider = getAiProvider();
  const difficultyConfig = { ...defaultDifficultyConfig, ...payload.difficultyConfig };
  const generated = await generateMcqQuestionsWithAi({
    knowledgeItems,
    difficultyConfig,
    context: payload,
  });
  const saved = [];
  const rejected = [];

  for (const question of generated) {
    const candidate = {
      ...question,
      curriculumId: payload.curriculumId,
      courseId: payload.courseId,
      subject: payload.subject,
      weekNo: payload.weekNo,
      topic: payload.topic,
      createdBy: payload.createdBy,
    };

    try {
      validateGeneratedQuestion(candidate);
      const duplicateCheck = findDuplicateQuestion(candidate, [...existingQuestions, ...saved]);

      if (duplicateCheck.duplicate) {
        rejected.push({ question: candidate.question, reason: 'duplicate', ...duplicateCheck });
        continue;
      }

      const questionId = await createQuestion({
        ...candidate,
        similarityScore: duplicateCheck.similarityScore,
        approvalStatus: payload.approvalStatus || 'pending',
        status: 'draft',
      });
      saved.push({ id: questionId, ...candidate, similarityScore: duplicateCheck.similarityScore });
    } catch (error) {
      rejected.push({
        question: candidate.question,
        reason: error.message,
        errors: error.errors || [],
      });
    }
  }

  await createProcessingLog({
    ...payload,
    eventType: 'questions_generated',
    teacherId: payload.createdBy,
    message: 'AI question generation completed.',
    metadata: {
      provider: provider.name,
      generated: generated.length,
      rejected: rejected.length,
      saved: saved.length,
      processingTimeMs: Date.now() - startedAt,
    },
  });
  await updateLatestAiUsageOutcome({
    provider: provider.name,
    teacherId: payload.createdBy,
    topic: payload.topic,
    weekNo: payload.weekNo,
    questionsSaved: saved.length,
    questionsRejected: rejected.length,
  });
  performanceMetricsService.recordAiProcessing({
    provider: provider.name,
    durationMs: Date.now() - startedAt,
    generated: generated.length,
    saved: saved.length,
    rejected: rejected.length,
  });

  return {
    provider: provider.name,
    generated: generated.length,
    rejected: rejected.length,
    saved: saved.length,
    processingTimeMs: Date.now() - startedAt,
    questions: saved,
    rejectedQuestions: rejected,
  };
}

export async function generateBatchQuestions(payload) {
  const topics = Array.isArray(payload.topics) && payload.topics.length ? payload.topics : [payload];
  const results = [];

  for (const topicPayload of topics) {
    results.push(
      await generateQuestions({
        ...payload,
        ...topicPayload,
        weekNo: Number(topicPayload.weekNo || payload.weekNo),
        forceRegenerate: payload.forceRegenerate,
      }),
    );
  }

  return {
    batches: results.length,
    generated: results.reduce((total, item) => total + item.generated, 0),
    rejected: results.reduce((total, item) => total + item.rejected, 0),
    saved: results.reduce((total, item) => total + item.saved, 0),
    results,
  };
}

export async function regenerateQuestion(id, payload) {
  const existing = await findQuestionById(id);

  if (!existing) {
    throw new AppError('Question not found', 404);
  }

  await updateQuestion(id, { status: 'archived', approvalStatus: 'rejected' });

  return generateQuestions({
    curriculumId: existing.curriculumId,
    courseId: existing.courseId,
    subject: existing.subject,
    weekNo: existing.weekNo,
    topic: existing.topic,
    createdBy: payload.createdBy,
    difficultyConfig: { [existing.difficulty]: 1 },
    forceRegenerate: true,
  });
}

export async function getQuestion(id) {
  const question = await findQuestionById(id);

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  return question;
}

export async function updateQuestionById(id, payload) {
  await getQuestion(id);
  await updateQuestion(id, payload);
  return getQuestion(id);
}

export async function archiveQuestion(id) {
  await getQuestion(id);
  await updateQuestion(id, { status: 'archived' });
  return true;
}

export async function restoreQuestion(id) {
  await getQuestion(id);
  await updateQuestion(id, { status: 'draft' });
  return true;
}

export async function deleteQuestion(id) {
  await getQuestion(id);
  await deleteQuestionById(id);
  return true;
}

export const searchQuestions = listQuestions;
export const getGenerationLogs = listGenerationLogs;

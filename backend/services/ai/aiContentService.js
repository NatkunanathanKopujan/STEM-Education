import { AppError } from '../../utils/appError.js';
import { createContentHash } from '../../utils/contentHash.js';
import { normalizeLearningText } from '../../utils/textExtractor.js';
import {
  createKnowledgeEntry,
  createProcessingLog,
  findCompletedTopic,
  findKnowledgeByHash,
  listKnowledge,
  listQuestions,
  listTopics,
  upsertTopicStatus,
} from '../../repositories/aiRepository.js';

const completedStatus = 'completed';

export async function extractLearningText({ text, fileText, description }) {
  return normalizeLearningText([text, fileText, description].filter(Boolean).join('\n\n'));
}

export async function markTopicStatus(payload) {
  await upsertTopicStatus(payload);
  return { status: payload.status, topic: payload.topic };
}

export async function buildKnowledgeBase(payload) {
  const topic = await findCompletedTopic(payload);

  if (!topic || topic.status !== completedStatus) {
    await createProcessingLog({
      ...payload,
      eventType: 'processing_error',
      message: 'Topic is not completed. Content excluded from AI knowledge base.',
      metadata: { rule: 'completed_topics_only' },
    });

    throw new AppError('Only completed topics can be stored in the AI knowledge base', 422);
  }

  const extractedText = normalizeLearningText(payload.extractedText);

  if (!extractedText) {
    throw new AppError('Extracted text is required to build the AI knowledge base', 422);
  }

  const contentHash = createContentHash(
    `${payload.curriculumId || ''}:${payload.courseId || ''}:${payload.subject}:${payload.weekNo}:${payload.topic}:${extractedText}`,
  );
  const existing = await findKnowledgeByHash(contentHash);

  if (existing) {
    await createProcessingLog({
      ...payload,
      eventType: 'knowledge_base_updated',
      message: 'Duplicate content detected. Existing knowledge entry reused.',
      metadata: { knowledgeId: existing.id, duplicate: true },
    });

    return { duplicate: true, knowledgeId: existing.id };
  }

  const knowledgeId = await createKnowledgeEntry({
    ...payload,
    extractedText,
    contentHash,
  });

  await createProcessingLog({
    ...payload,
    eventType: 'knowledge_base_updated',
    message: 'Completed topic content stored in AI knowledge base.',
    metadata: { knowledgeId },
  });

  return { duplicate: false, knowledgeId };
}

export async function processMaterial(payload) {
  await createProcessingLog({
    ...payload,
    eventType: 'material_uploaded',
    message: 'Material received for AI processing.',
  });
  await createProcessingLog({
    ...payload,
    eventType: 'extraction_started',
    message: 'Text extraction started.',
  });

  const extractedText = payload.extractedText || (await extractLearningText(payload));

  await createProcessingLog({
    ...payload,
    eventType: 'extraction_completed',
    message: 'Text extraction completed.',
    metadata: { textLength: extractedText.length },
  });

  return buildKnowledgeBase({ ...payload, extractedText });
}

export const getKnowledge = listKnowledge;
export const getQuestions = listQuestions;
export const getTopics = listTopics;

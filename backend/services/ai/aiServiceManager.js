import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import { createAiUsageLog, getAiCostSummary, listAiUsageLogs } from '../../repositories/aiUsageRepository.js';
import { validateGeneratedQuestion } from './questionValidationService.js';
import { buildMcqPrompt, MCQ_PROMPT_ID } from './prompts/mcqPromptTemplate.js';
import { getAiProvider, listAiModels, listAiProviders } from './providers/aiProviderFactory.js';
import { parseAiQuestionResponse } from './responseParser.js';
import { withRetry } from './retryService.js';

const estimateTokens = (value) => Math.ceil(String(value || '').length / 4);

const costRateKeys = {
  openai: ['openaiInput', 'openaiOutput'],
  gemini: ['geminiInput', 'geminiOutput'],
  ollama: ['ollamaInput', 'ollamaOutput'],
};

function estimateCost(providerName, usage = {}) {
  const [inputKey, outputKey] = costRateKeys[providerName] || [];
  const inputRate = Number(env.ai.costPer1kTokens[inputKey] || 0);
  const outputRate = Number(env.ai.costPer1kTokens[outputKey] || 0);
  const promptTokens = Number(usage.promptTokens || 0);
  const completionTokens = Number(usage.completionTokens || 0);

  return Number(((promptTokens / 1000) * inputRate + (completionTokens / 1000) * outputRate).toFixed(6));
}

function countQuestions(difficultyConfig) {
  return Object.values(difficultyConfig).reduce((total, count) => total + Number(count || 0), 0);
}

function normalizeQuestion(question, fallback) {
  return {
    ...question,
    difficulty: question.difficulty || 'medium',
    category: question.category || 'concept',
    topic: question.topic || fallback.topic,
    weekNo: Number(question.weekNo || fallback.weekNo),
    aiVersion: `${fallback.provider.name}:${fallback.provider.model}`,
  };
}

export async function generateMcqQuestionsWithAi({
  knowledgeItems,
  difficultyConfig,
  context,
}) {
  const provider = getAiProvider();
  const questionCount = countQuestions(difficultyConfig);

  if (!questionCount) {
    throw new AppError('Question count must be greater than zero', 422);
  }

  const prompt = buildMcqPrompt({
    knowledgeItems,
    difficultyConfig,
    topic: context.topic,
    subject: context.subject,
    weekNo: context.weekNo,
    questionCount,
  });
  const startedAt = new Date();

  try {
    const result = await withRetry(
      () =>
        provider.generateText({
          prompt,
          context,
        }),
      {
        onRetry: ({ attempt, error }) =>
          createAiUsageLog({
            provider: provider.name,
            model: provider.model,
            teacherId: context.createdBy,
            curriculumId: context.curriculumId,
            courseId: context.courseId,
            subject: context.subject,
            topic: context.topic,
            weekNo: context.weekNo,
            promptId: MCQ_PROMPT_ID,
            startedAt,
            endedAt: new Date(),
            durationMs: Date.now() - startedAt.getTime(),
            status: 'failed',
            errorMessage: `Retry ${attempt}: ${error.message}`,
          }),
      },
    );
    const parsed = parseAiQuestionResponse(result.text);
    const normalized = parsed.map((question) => normalizeQuestion(question, { ...context, provider }));

    normalized.forEach(validateGeneratedQuestion);

    await createAiUsageLog({
      provider: provider.name,
      model: provider.model,
      teacherId: context.createdBy,
      curriculumId: context.curriculumId,
      courseId: context.courseId,
      subject: context.subject,
      topic: context.topic,
      weekNo: context.weekNo,
      promptId: MCQ_PROMPT_ID,
      startedAt,
      endedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
      promptTokens: result.usage?.promptTokens || estimateTokens(prompt),
      completionTokens: result.usage?.completionTokens || estimateTokens(result.text),
      totalTokens:
        result.usage?.totalTokens || estimateTokens(prompt) + estimateTokens(result.text),
      estimatedCost: estimateCost(provider.name, result.usage),
      questionsGenerated: normalized.length,
      status: 'success',
      metadata: {
        requestedQuestionCount: questionCount,
        temperature: env.ai.temperature,
      },
    });

    return normalized;
  } catch (error) {
    await createAiUsageLog({
      provider: provider.name,
      model: provider.model,
      teacherId: context.createdBy,
      curriculumId: context.curriculumId,
      courseId: context.courseId,
      subject: context.subject,
      topic: context.topic,
      weekNo: context.weekNo,
      promptId: MCQ_PROMPT_ID,
      startedAt,
      endedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime(),
      status: 'failed',
      errorMessage: error.message,
    });

    throw new AppError('AI question generation failed after retries', error.statusCode || 502);
  }
}

export function getProviderMetadata() {
  return {
    activeProvider: env.ai.provider,
    providers: listAiProviders(),
  };
}

export function getModelMetadata() {
  return listAiModels();
}

export const getAiLogs = listAiUsageLogs;
export const getAiCosts = getAiCostSummary;

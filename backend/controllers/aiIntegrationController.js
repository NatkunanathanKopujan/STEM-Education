import { validateGeneratedQuestion } from '../services/ai/questionValidationService.js';
import {
  generateBatchQuestions,
  generateQuestions,
  regenerateQuestion,
} from '../services/ai/questionGenerationService.js';
import {
  getAiCosts,
  getAiLogs,
  getModelMetadata,
  getProviderMetadata,
} from '../services/ai/aiServiceManager.js';
import { sendSuccess } from '../utils/apiResponse.js';

function buildGenerationPayload(req) {
  return {
    ...req.body,
    curriculumId: req.body.curriculumId || null,
    courseId: req.body.courseId || null,
    weekNo: Number(req.body.weekNo),
    createdBy: req.user.id,
  };
}

export async function generateController(req, res, next) {
  try {
    const data = await generateQuestions(buildGenerationPayload(req));
    return sendSuccess(res, data, 'AI generation completed', 201);
  } catch (error) {
    return next(error);
  }
}

export async function generateBatchController(req, res, next) {
  try {
    const data = await generateBatchQuestions(buildGenerationPayload(req));
    return sendSuccess(res, data, 'AI batch generation completed', 201);
  } catch (error) {
    return next(error);
  }
}

export async function regenerateController(req, res, next) {
  try {
    const data = await regenerateQuestion(req.body.questionId, { createdBy: req.user.id });
    return sendSuccess(res, data, 'AI question regenerated');
  } catch (error) {
    return next(error);
  }
}

export async function validateAiQuestionController(req, res, next) {
  try {
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [req.body];
    const results = questions.map((question) => {
      try {
        validateGeneratedQuestion(question);
        return { valid: true, question: question.question };
      } catch (error) {
        return { valid: false, question: question.question, errors: error.errors || [error.message] };
      }
    });

    return sendSuccess(res, { results }, 'AI question validation completed');
  } catch (error) {
    return next(error);
  }
}

export async function providersController(_req, res, next) {
  try {
    return sendSuccess(res, getProviderMetadata(), 'AI providers fetched');
  } catch (error) {
    return next(error);
  }
}

export async function modelsController(_req, res, next) {
  try {
    return sendSuccess(res, getModelMetadata(), 'AI models fetched');
  } catch (error) {
    return next(error);
  }
}

export async function aiLogsController(req, res, next) {
  try {
    const data = await getAiLogs({
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    });
    return sendSuccess(res, data, 'AI logs fetched');
  } catch (error) {
    return next(error);
  }
}

export async function aiCostsController(_req, res, next) {
  try {
    const data = await getAiCosts();
    return sendSuccess(res, data, 'AI cost summary fetched');
  } catch (error) {
    return next(error);
  }
}

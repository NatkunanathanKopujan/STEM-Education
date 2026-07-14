import { sendSuccess } from '../utils/apiResponse.js';
import {
  archiveQuestion,
  deleteQuestion,
  generateQuestions,
  getGenerationLogs,
  getQuestion,
  regenerateQuestion,
  restoreQuestion,
  searchQuestions,
  updateQuestionById,
} from '../services/ai/questionGenerationService.js';

export async function generateQuestionsController(req, res, next) {
  try {
    const result = await generateQuestions({
      ...req.body,
      curriculumId: req.body.curriculumId || null,
      courseId: req.body.courseId || null,
      weekNo: Number(req.body.weekNo),
      createdBy: req.user.id,
    });

    return sendSuccess(res, result, 'AI questions generated successfully', 201);
  } catch (error) {
    return next(error);
  }
}

export async function regenerateQuestionController(req, res, next) {
  try {
    const result = await regenerateQuestion(req.params.id, { createdBy: req.user.id });
    return sendSuccess(res, result, 'AI question regenerated successfully');
  } catch (error) {
    return next(error);
  }
}

export async function getQuestionsController(req, res, next) {
  try {
    const data = await searchQuestions({
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
      filters: req.query,
    });
    return sendSuccess(res, data, 'AI question bank fetched');
  } catch (error) {
    return next(error);
  }
}

export async function getQuestionController(req, res, next) {
  try {
    const data = await getQuestion(req.params.id);
    return sendSuccess(res, data, 'AI question fetched');
  } catch (error) {
    return next(error);
  }
}

export async function updateQuestionController(req, res, next) {
  try {
    const payload = { ...req.body };

    if (payload.approvalStatus === 'approved') {
      payload.approvedBy = req.user.id;
      payload.status = 'approved';
    }

    const data = await updateQuestionById(req.params.id, payload);
    return sendSuccess(res, data, 'AI question updated');
  } catch (error) {
    return next(error);
  }
}

export async function deleteQuestionController(req, res, next) {
  try {
    if (req.query.mode === 'hard') {
      await deleteQuestion(req.params.id);
      return sendSuccess(res, null, 'AI question deleted');
    }

    await archiveQuestion(req.params.id);
    return sendSuccess(res, null, 'AI question archived');
  } catch (error) {
    return next(error);
  }
}

export async function restoreQuestionController(req, res, next) {
  try {
    await restoreQuestion(req.params.id);
    return sendSuccess(res, null, 'AI question restored');
  } catch (error) {
    return next(error);
  }
}

export async function getGenerationLogsController(req, res, next) {
  try {
    const data = await getGenerationLogs({
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    });
    return sendSuccess(res, data, 'AI generation logs fetched');
  } catch (error) {
    return next(error);
  }
}

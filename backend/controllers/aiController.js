import { extractTextFromFile } from '../utils/textExtractor.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  buildKnowledgeBase,
  getKnowledge,
  getQuestions,
  getTopics,
  markTopicStatus,
  processMaterial,
} from '../services/ai/aiContentService.js';

const getTeacherId = (req) => req.body.teacherId || req.user?.id;

export async function processMaterialController(req, res, next) {
  try {
    const fileText = req.file ? await extractTextFromFile(req.file.path) : null;
    const result = await processMaterial({
      ...req.body,
      teacherId: getTeacherId(req),
      weekNo: Number(req.body.weekNo),
      fileText,
    });

    return sendSuccess(res, result, 'Material processed for AI knowledge foundation');
  } catch (error) {
    return next(error);
  }
}

export async function extractTextController(req, res, next) {
  try {
    const fileText = req.file ? await extractTextFromFile(req.file.path) : null;
    const extractedText = [req.body.text, req.body.description, fileText]
      .filter(Boolean)
      .join('\n\n');

    return sendSuccess(
      res,
      {
        extractedText,
        source: req.file?.filename || 'request-body',
        length: extractedText.length,
      },
      'Text extraction completed',
    );
  } catch (error) {
    return next(error);
  }
}

export async function buildKnowledgeBaseController(req, res, next) {
  try {
    const fileText = req.file ? await extractTextFromFile(req.file.path) : null;
    const result = await buildKnowledgeBase({
      ...req.body,
      extractedText: req.body.extractedText || fileText,
      teacherId: getTeacherId(req),
      weekNo: Number(req.body.weekNo),
    });

    return sendSuccess(res, result, 'AI knowledge base updated');
  } catch (error) {
    return next(error);
  }
}

export async function markTopicController(req, res, next) {
  try {
    const result = await markTopicStatus({
      ...req.body,
      teacherId: getTeacherId(req),
      weekNo: Number(req.body.weekNo),
    });

    return sendSuccess(res, result, 'AI topic status updated');
  } catch (error) {
    return next(error);
  }
}

export async function getKnowledgeController(req, res, next) {
  try {
    const data = await getKnowledge({
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    });
    return sendSuccess(res, data, 'AI knowledge base fetched');
  } catch (error) {
    return next(error);
  }
}

export async function getQuestionsController(req, res, next) {
  try {
    const data = await getQuestions({
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    });
    return sendSuccess(res, data, 'AI question bank fetched');
  } catch (error) {
    return next(error);
  }
}

export async function getTopicsController(_req, res, next) {
  try {
    const data = await getTopics();
    return sendSuccess(res, data, 'AI question topics fetched');
  } catch (error) {
    return next(error);
  }
}

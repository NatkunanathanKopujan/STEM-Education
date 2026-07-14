import { sendSuccess } from '../utils/apiResponse.js';
import {
  getCurrentStudentQuiz,
  getStudentQuizHistory,
  getStudentQuizResult,
  getStudentQuizReview,
  saveStudentQuizAnswer,
  startStudentQuiz,
  submitStudentQuiz,
} from '../services/studentQuizService.js';

export async function startQuizController(req, res, next) {
  try {
    const data = await startStudentQuiz({
      user: req.user,
      filters: {
        curriculumId: req.body.curriculumId ? Number(req.body.curriculumId) : null,
        courseId: req.body.courseId ? Number(req.body.courseId) : null,
        subject: req.body.subject || null,
      },
    });

    return sendSuccess(res, data, data.restored ? 'Unfinished quiz restored' : 'AI quiz started', 201);
  } catch (error) {
    return next(error);
  }
}

export async function currentQuizController(req, res, next) {
  try {
    const data = await getCurrentStudentQuiz(req.user);
    return sendSuccess(res, data, 'Current quiz fetched');
  } catch (error) {
    return next(error);
  }
}

export async function saveAnswerController(req, res, next) {
  try {
    const data = await saveStudentQuizAnswer({
      user: req.user,
      attemptId: Number(req.body.attemptId),
      questionId: Number(req.body.questionId),
      selectedAnswer: req.body.selectedAnswer,
    });

    return sendSuccess(res, data, 'Answer saved');
  } catch (error) {
    return next(error);
  }
}

export async function submitQuizController(req, res, next) {
  try {
    const data = await submitStudentQuiz({
      user: req.user,
      attemptId: Number(req.body.attemptId),
    });

    return sendSuccess(res, data, 'Quiz Completed Successfully');
  } catch (error) {
    return next(error);
  }
}

export async function quizHistoryController(req, res, next) {
  try {
    const data = await getStudentQuizHistory(req.user);
    return sendSuccess(res, data, 'Quiz history fetched');
  } catch (error) {
    return next(error);
  }
}

export async function quizResultController(req, res, next) {
  try {
    const data = await getStudentQuizResult({
      user: req.user,
      quizNumber: Number(req.params.quizNumber),
    });

    return sendSuccess(res, data, 'Quiz result fetched');
  } catch (error) {
    return next(error);
  }
}

export async function quizReviewController(req, res, next) {
  try {
    const data = await getStudentQuizReview({
      user: req.user,
      quizNumber: Number(req.params.quizNumber),
    });

    return sendSuccess(res, data, 'Quiz review fetched');
  } catch (error) {
    return next(error);
  }
}

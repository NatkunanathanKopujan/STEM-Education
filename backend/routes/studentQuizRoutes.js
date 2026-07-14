import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import {
  currentQuizController,
  quizHistoryController,
  quizResultController,
  quizReviewController,
  saveAnswerController,
  startQuizController,
  submitQuizController,
} from '../controllers/studentQuizController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendError } from '../utils/apiResponse.js';
import {
  quizNumberValidator,
  saveAnswerValidator,
  startQuizValidator,
  submitQuizValidator,
} from '../validators/studentQuizValidators.js';

const router = Router();

function requireStudentOnly(req, res, next) {
  if (req.user?.role !== ROLES.STUDENT) {
    return sendError(res, 'Only student users can access student quiz endpoints', 403);
  }

  return next();
}

router.use(authenticate);
router.use(requireStudentOnly);

router.post('/start', startQuizValidator, validateRequest, startQuizController);
router.get('/current', currentQuizController);
router.post('/save-answer', saveAnswerValidator, validateRequest, saveAnswerController);
router.post('/submit', submitQuizValidator, validateRequest, submitQuizController);
router.get('/history', quizHistoryController);
router.get('/result/:quizNumber', quizNumberValidator, validateRequest, quizResultController);
router.get('/review/:quizNumber', quizNumberValidator, validateRequest, quizReviewController);

export default router;

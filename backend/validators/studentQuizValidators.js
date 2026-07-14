import { body, param } from 'express-validator';

export const startQuizValidator = [
  body('curriculumId').optional({ nullable: true }).isInt({ min: 1 }),
  body('courseId').optional({ nullable: true }).isInt({ min: 1 }),
  body('subject').optional({ nullable: true }).trim().isLength({ min: 2, max: 180 }),
];

export const saveAnswerValidator = [
  body('attemptId').isInt({ min: 1 }).withMessage('Attempt ID is required'),
  body('questionId').isInt({ min: 1 }).withMessage('Question ID is required'),
  body('selectedAnswer').isIn(['A', 'B', 'C', 'D']).withMessage('Selected answer is invalid'),
];

export const submitQuizValidator = [
  body('attemptId').isInt({ min: 1 }).withMessage('Attempt ID is required'),
];

export const quizNumberValidator = [
  param('quizNumber').isInt({ min: 1 }).withMessage('Quiz number must be valid'),
];

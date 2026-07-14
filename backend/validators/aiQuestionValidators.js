import { body, param, query } from 'express-validator';

export const questionIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Question ID must be valid'),
];

export const generateQuestionsValidator = [
  body('curriculumId').optional({ nullable: true }).isInt({ min: 1 }),
  body('courseId').optional({ nullable: true }).isInt({ min: 1 }),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('weekNo').isInt({ min: 1 }).withMessage('Week number must be valid'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('difficultyConfig.easy').optional().isInt({ min: 0, max: 50 }),
  body('difficultyConfig.medium').optional().isInt({ min: 0, max: 50 }),
  body('difficultyConfig.hard').optional().isInt({ min: 0, max: 50 }),
];

export const updateQuestionValidator = [
  ...questionIdValidator,
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('category')
    .optional()
    .isIn(['concept', 'definition', 'scenario', 'practical', 'true_false_mcq', 'application']),
  body('question').optional().trim().isLength({ min: 12 }),
  body('optionA').optional().trim().notEmpty(),
  body('optionB').optional().trim().notEmpty(),
  body('optionC').optional().trim().notEmpty(),
  body('optionD').optional().trim().notEmpty(),
  body('correctAnswer').optional().isIn(['A', 'B', 'C', 'D']),
  body('explanation').optional().trim().isLength({ min: 10 }),
  body('approvalStatus').optional().isIn(['pending', 'approved', 'rejected']),
  body('status').optional().isIn(['draft', 'approved', 'archived']),
];

export const questionSearchValidator = [
  query('curriculumId').optional().isInt({ min: 1 }),
  query('subject').optional().trim(),
  query('weekNo').optional().isInt({ min: 1 }),
  query('topic').optional().trim(),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('teacherId').optional().isInt({ min: 1 }),
  query('approvalStatus').optional().isIn(['pending', 'approved', 'rejected']),
  query('createdDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
];

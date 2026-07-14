import { body, query } from 'express-validator';

export const aiGenerateValidator = [
  body('curriculumId').optional({ nullable: true }).isInt({ min: 1 }),
  body('courseId').optional({ nullable: true }).isInt({ min: 1 }),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('weekNo').isInt({ min: 1 }).withMessage('Week number must be valid'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('difficultyConfig.easy').optional().isInt({ min: 0, max: 100 }),
  body('difficultyConfig.medium').optional().isInt({ min: 0, max: 100 }),
  body('difficultyConfig.hard').optional().isInt({ min: 0, max: 100 }),
];

export const aiGenerateBatchValidator = [
  body('topics').isArray({ min: 1 }).withMessage('Topics array is required'),
  body('topics.*.subject').trim().notEmpty().withMessage('Subject is required'),
  body('topics.*.weekNo').isInt({ min: 1 }).withMessage('Week number must be valid'),
  body('topics.*.topic').trim().notEmpty().withMessage('Topic is required'),
  body('difficultyConfig.easy').optional().isInt({ min: 0, max: 100 }),
  body('difficultyConfig.medium').optional().isInt({ min: 0, max: 100 }),
  body('difficultyConfig.hard').optional().isInt({ min: 0, max: 100 }),
];

export const aiRegenerateValidator = [
  body('questionId').isInt({ min: 1 }).withMessage('Question ID is required'),
];

export const aiValidateValidator = [
  body('questions').optional().isArray({ min: 1 }),
];

export const aiLogsValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
];

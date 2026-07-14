import { body, param, query } from 'express-validator';

export const studentAnalyticsValidator = [
  param('id').isInt({ min: 1 }).withMessage('Student ID must be valid'),
];

export const attemptReviewValidator = [
  param('attemptId').isInt({ min: 1 }).withMessage('Attempt ID must be valid'),
];

export const reportQueryValidator = [
  query('curriculumId').optional().isInt({ min: 1 }),
  query('subject').optional().trim(),
  query('weekNo').optional().isInt({ min: 1 }),
  query('topic').optional().trim(),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
];

export const exportReportValidator = [
  body('reportType')
    .optional()
    .isIn([
      'student-performance',
      'topic-performance',
      'weekly-progress',
      'quiz-statistics',
      'question-exposure',
    ]),
  body('format').optional().isIn(['pdf', 'excel']),
];

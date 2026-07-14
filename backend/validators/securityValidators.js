import { body, query } from 'express-validator';

export const securityListValidator = [
  query('search').optional().trim().isLength({ max: 255 }),
  query('userId').optional().isInt({ min: 1 }),
  query('role').optional().isIn(['super-admin', 'admin', 'teacher', 'student']),
  query('module').optional().trim().isLength({ max: 120 }),
  query('action').optional().trim().isLength({ max: 120 }),
  query('status').optional().trim().isLength({ max: 80 }),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const lockUserValidator = [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
];

export const backupValidator = [
  body('backupType').optional().isIn(['manual', 'scheduled', 'incremental', 'full']),
  body('backupScope')
    .optional()
    .isIn(['full', 'database', 'files', 'configuration', 'ai_question_bank', 'learning_materials', 'notifications', 'audit_logs', 'user_data']),
  body('includes').optional().isArray(),
];

export const restoreValidator = [
  body('backupId').optional().isInt({ min: 1 }),
  body('restoreScope')
    .optional()
    .isIn(['metadata_validation', 'database', 'files', 'configuration', 'ai_question_bank', 'learning_materials']),
  body('sections').optional().isArray(),
];

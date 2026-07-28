import { body, param, query } from 'express-validator';

const optionalField = { values: 'falsy' };

export const weeklyPlanQueryValidator = [
  query('search').optional(optionalField).trim().isLength({ max: 255 }),
  query('contentType').optional(optionalField).isIn(['completed', 'upcoming']),
  query('status').optional(optionalField).isIn(['draft', 'published', 'completed', 'upcoming']),
  query('departmentId').optional(optionalField).isInt({ min: 1 }),
  query('weekNo').optional(optionalField).isInt({ min: 1 }),
  query('page').optional(optionalField).isInt({ min: 1 }),
  query('limit').optional(optionalField).isInt({ min: 1, max: 100 }),
];

export const weeklyPlanIdValidator = [param('id').isInt({ min: 1 }).withMessage('Valid weekly plan ID is required')];

export const weeklyPlanCreateValidator = [
  body('departmentId').isInt({ min: 1 }).withMessage('Department is required'),
  body('teacherId').optional(optionalField).isInt({ min: 1 }),
  body('courseId').optional(optionalField).isInt({ min: 1 }),
  body('contentType').isIn(['completed', 'upcoming']).withMessage('Plan type must be completed or upcoming'),
  body('weekNo').isInt({ min: 1 }).withMessage('Week number is required'),
  body('topic').trim().notEmpty().isLength({ max: 180 }).withMessage('Topic is required'),
  body('objectives').optional(optionalField).trim().isLength({ max: 5000 }),
  body('activities').optional(optionalField).trim().isLength({ max: 5000 }),
  body('resources').optional(optionalField).trim().isLength({ max: 5000 }),
  body('attachmentFileId').optional(optionalField).isInt({ min: 1 }),
  body('resourceLink').optional(optionalField).trim().isLength({ max: 1000 }).isURL().withMessage('Resource link must be a valid URL'),
  body('plannedDate').optional(optionalField).isISO8601(),
  body('status').optional(optionalField).isIn(['draft', 'published', 'completed', 'upcoming']),
];

export const weeklyPlanUpdateValidator = [
  ...weeklyPlanIdValidator,
  body('departmentId').optional(optionalField).isInt({ min: 1 }),
  body('teacherId').optional(optionalField).isInt({ min: 1 }),
  body('courseId').optional(optionalField).isInt({ min: 1 }),
  body('contentType').optional(optionalField).isIn(['completed', 'upcoming']),
  body('weekNo').optional(optionalField).isInt({ min: 1 }),
  body('topic').optional(optionalField).trim().isLength({ min: 1, max: 180 }),
  body('objectives').optional(optionalField).trim().isLength({ max: 5000 }),
  body('activities').optional(optionalField).trim().isLength({ max: 5000 }),
  body('resources').optional(optionalField).trim().isLength({ max: 5000 }),
  body('attachmentFileId').optional(optionalField).isInt({ min: 1 }),
  body('resourceLink').optional(optionalField).trim().isLength({ max: 1000 }).isURL().withMessage('Resource link must be a valid URL'),
  body('plannedDate').optional(optionalField).isISO8601(),
  body('status').optional(optionalField).isIn(['draft', 'published', 'completed', 'upcoming']),
];

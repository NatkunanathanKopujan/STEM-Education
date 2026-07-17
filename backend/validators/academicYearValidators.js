import { body, param, query } from 'express-validator';

export const academicYearListValidator = [
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  query('status').optional({ values: 'falsy' }).isIn(['upcoming', 'active', 'archived']),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
  query('offset').optional({ values: 'falsy' }).isInt({ min: 0 }),
];

export const academicYearIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Academic year id must be a positive integer'),
];

export const academicYearPayloadValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Academic year name is required')
    .isLength({ max: 50 })
    .withMessage('Academic year name must be 50 characters or less'),
  body('startDate').optional({ nullable: true, values: 'falsy' }).isISO8601().toDate(),
  body('endDate').optional({ nullable: true, values: 'falsy' }).isISO8601().toDate(),
  body('status').optional({ values: 'falsy' }).isIn(['upcoming', 'active', 'archived']),
  body('isCurrent').optional().isBoolean().toBoolean(),
  body('description').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 255 }),
];

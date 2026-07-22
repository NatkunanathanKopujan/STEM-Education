import { param, query } from 'express-validator';

export const idParamValidator = [
  param('id').notEmpty().withMessage('ID is required'),
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional({ values: 'falsy' })
    .isIn(['createdDate', 'fullName', 'username', 'email', 'status', 'code', 'name'])
    .withMessage('Sort field is invalid'),
  query('direction')
    .optional({ values: 'falsy' })
    .isIn(['asc', 'desc'])
    .withMessage('Sort direction must be asc or desc'),
];

export const emptyBodyValidator = [];

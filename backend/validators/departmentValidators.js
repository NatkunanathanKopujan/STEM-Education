import { body, param, query } from 'express-validator';

const optionalField = { values: 'falsy' };

export const departmentQueryValidator = [
  query('search').optional(optionalField).trim(),
  query('status').optional(optionalField).isIn(['active', 'inactive', 'Active', 'Inactive']),
  query('page').optional(optionalField).isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional(optionalField).isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional(optionalField).isIn(['name', 'status', 'createdAt', 'updatedAt']),
  query('direction').optional(optionalField).isIn(['asc', 'desc']),
];

export const departmentIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Department ID must be valid'),
];

export const departmentCreateValidator = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Department name must be 2 to 120 characters'),
  body('description').optional(optionalField).trim().isLength({ max: 1000 }).withMessage('Description is too long'),
  body('status').optional(optionalField).isIn(['active', 'inactive', 'Active', 'Inactive']),
];

export const departmentUpdateValidator = [
  body('name').optional(optionalField).trim().isLength({ min: 2, max: 120 }).withMessage('Department name must be 2 to 120 characters'),
  body('description').optional(optionalField).trim().isLength({ max: 1000 }).withMessage('Description is too long'),
  body('status').optional(optionalField).isIn(['active', 'inactive', 'Active', 'Inactive']),
];

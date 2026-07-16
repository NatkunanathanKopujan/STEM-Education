import { body, param, query } from 'express-validator';
import { allManagedFileExtensions } from '../utils/fileHelper.js';

const optionalField = { values: 'falsy' };

export const fileListValidator = [
  query('search').optional(optionalField).trim().isLength({ max: 255 }),
  query('fileType')
    .optional(optionalField)
    .isIn(['pdf', 'ppt', 'documents', 'spreadsheets', 'archives', 'videos', 'images', 'audio'])
    .withMessage('Invalid file type'),
  query('status').optional(optionalField).isIn(['active', 'archived', 'draft', 'deleted']),
  query('visibility').optional(optionalField).isIn(['public', 'private', 'restricted', 'draft']),
  query('weekNo').optional(optionalField).isInt({ min: 1 }),
  query('teacher').optional(optionalField).trim().isLength({ max: 150 }),
  query('subject').optional(optionalField).trim().isLength({ max: 150 }),
  query('curriculum').optional(optionalField).trim().isLength({ max: 150 }),
  query('topic').optional(optionalField).trim().isLength({ max: 255 }),
  query('minSize').optional(optionalField).isInt({ min: 0 }),
  query('maxSize').optional(optionalField).isInt({ min: 0 }),
  query('dateFrom').optional(optionalField).isISO8601(),
  query('dateTo').optional(optionalField).isISO8601(),
  query('sort').optional(optionalField).isIn(['newest', 'oldest', 'az', 'za', 'largest', 'mostDownloaded', 'mostViewed']),
  query('page').optional(optionalField).isInt({ min: 1 }),
  query('limit').optional(optionalField).isInt({ min: 1, max: 100 }),
];

export const fileIdValidator = [param('id').isInt({ min: 1 }).withMessage('Valid file ID is required')];

export const uploadMetadataValidator = [
  body('curriculum').optional(optionalField).trim().isLength({ max: 150 }),
  body('subject').optional(optionalField).trim().isLength({ max: 150 }),
  body('weekNo').optional(optionalField).isInt({ min: 1 }),
  body('topic').optional(optionalField).trim().isLength({ max: 255 }),
  body('description').optional(optionalField).trim().isLength({ max: 1000 }),
  body('visibility').optional(optionalField).isIn(['public', 'private', 'restricted', 'draft']),
  body('status').optional(optionalField).isIn(['active', 'archived', 'draft']),
  body('tags').optional(optionalField).trim().isLength({ max: 500 }),
  body('versionNote').optional(optionalField).trim().isLength({ max: 1000 }),
  body('parentFileId').optional(optionalField).isInt({ min: 1 }),
  body('allowDuplicate').optional(optionalField).isBoolean().toBoolean(),
];

export const fileUpdateValidator = [
  ...fileIdValidator,
  body('curriculum').optional(optionalField).trim().isLength({ max: 150 }),
  body('subject').optional(optionalField).trim().isLength({ max: 150 }),
  body('weekNo').optional(optionalField).isInt({ min: 1 }),
  body('topic').optional(optionalField).trim().isLength({ max: 255 }),
  body('description').optional(optionalField).trim().isLength({ max: 1000 }),
  body('visibility').optional(optionalField).isIn(['public', 'private', 'restricted', 'draft']),
  body('status').optional(optionalField).isIn(['active', 'archived', 'draft']),
  body('tags').optional(optionalField).trim().isLength({ max: 500 }),
];

export const supportedExtensions = allManagedFileExtensions.join(', ');

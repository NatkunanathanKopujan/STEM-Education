import { body, param, query } from 'express-validator';
import { allManagedFileExtensions } from '../utils/fileHelper.js';

export const fileListValidator = [
  query('search').optional().trim().isLength({ max: 255 }),
  query('fileType')
    .optional()
    .isIn(['pdf', 'ppt', 'documents', 'spreadsheets', 'archives', 'videos', 'images', 'audio'])
    .withMessage('Invalid file type'),
  query('status').optional().isIn(['active', 'archived', 'draft', 'deleted']),
  query('visibility').optional().isIn(['public', 'private', 'restricted', 'draft']),
  query('weekNo').optional().isInt({ min: 1 }),
  query('teacher').optional().trim().isLength({ max: 150 }),
  query('subject').optional().trim().isLength({ max: 150 }),
  query('curriculum').optional().trim().isLength({ max: 150 }),
  query('topic').optional().trim().isLength({ max: 255 }),
  query('minSize').optional().isInt({ min: 0 }),
  query('maxSize').optional().isInt({ min: 0 }),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sort').optional().isIn(['newest', 'oldest', 'az', 'za', 'largest', 'mostDownloaded', 'mostViewed']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const fileIdValidator = [param('id').isInt({ min: 1 }).withMessage('Valid file ID is required')];

export const uploadMetadataValidator = [
  body('curriculum').optional().trim().isLength({ max: 150 }),
  body('subject').optional().trim().isLength({ max: 150 }),
  body('weekNo').optional().isInt({ min: 1 }),
  body('topic').optional().trim().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('visibility').optional().isIn(['public', 'private', 'restricted', 'draft']),
  body('status').optional().isIn(['active', 'archived', 'draft']),
  body('tags').optional().trim().isLength({ max: 500 }),
  body('versionNote').optional().trim().isLength({ max: 1000 }),
  body('parentFileId').optional().isInt({ min: 1 }),
  body('allowDuplicate').optional().isBoolean().toBoolean(),
];

export const fileUpdateValidator = [
  ...fileIdValidator,
  body('curriculum').optional().trim().isLength({ max: 150 }),
  body('subject').optional().trim().isLength({ max: 150 }),
  body('weekNo').optional().isInt({ min: 1 }),
  body('topic').optional().trim().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('visibility').optional().isIn(['public', 'private', 'restricted', 'draft']),
  body('status').optional().isIn(['active', 'archived', 'draft']),
  body('tags').optional().trim().isLength({ max: 500 }),
];

export const supportedExtensions = allManagedFileExtensions.join(', ');

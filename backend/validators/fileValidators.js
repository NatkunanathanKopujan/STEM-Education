import { body, param, query } from 'express-validator';
import { allManagedFileExtensions } from '../utils/fileHelper.js';

const optionalField = { values: 'falsy' };
const audienceValues = ['all', 'super-admin', 'admin', 'teacher', 'student'];
const fileTypeValues = ['pdf', 'ppt', 'documents', 'spreadsheets', 'archives', 'videos', 'images', 'audio'];
const departmentIdsValidator = (value) => {
  const values = Array.isArray(value) ? value : String(value).split(',');
  return values.every((item) => Number.isInteger(Number(item)) && Number(item) > 0);
};
const fileTypesValidator = (value) => {
  const values = Array.isArray(value) ? value : String(value).split(',');
  return values.every((item) => fileTypeValues.includes(String(item).trim()));
};

export const fileListValidator = [
  query('search').optional(optionalField).trim().isLength({ max: 255 }),
  query('fileType')
    .optional(optionalField)
    .custom(fileTypesValidator)
    .withMessage('Invalid file type'),
  query('status').optional(optionalField).isIn(['active', 'archived', 'draft', 'deleted']),
  query('visibility').optional(optionalField).isIn(['public', 'private', 'restricted', 'draft']),
  query('audience').optional(optionalField).isIn(audienceValues),
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
  body('departmentId').optional(optionalField).isInt({ min: 1 }),
  body('curriculumId').optional(optionalField).isInt({ min: 1 }),
  body('courseId').optional(optionalField).isInt({ min: 1 }),
  body('curriculum').optional(optionalField).trim().isLength({ max: 150 }),
  body('subject').optional(optionalField).trim().isLength({ max: 150 }),
  body('weekNo').optional(optionalField).isInt({ min: 1 }),
  body('topic').optional(optionalField).trim().isLength({ max: 255 }),
  body('description').optional(optionalField).trim().isLength({ max: 1000 }),
  body('visibility').optional(optionalField).isIn(['public', 'private', 'restricted', 'draft']),
  body('audience').optional(optionalField).isIn(audienceValues),
  body('status').optional(optionalField).isIn(['active', 'archived', 'draft']),
  body('tags').optional(optionalField).trim().isLength({ max: 500 }),
  body('versionNote').optional(optionalField).trim().isLength({ max: 1000 }),
  body('departmentIds').optional(optionalField).custom(departmentIdsValidator).withMessage('Department IDs must be valid'),
  body('parentFileId').optional(optionalField).isInt({ min: 1 }),
  body('allowDuplicate').optional(optionalField).isBoolean().toBoolean(),
];

export const fileUpdateValidator = [
  ...fileIdValidator,
  body('departmentId').optional(optionalField).isInt({ min: 1 }),
  body('curriculumId').optional(optionalField).isInt({ min: 1 }),
  body('courseId').optional(optionalField).isInt({ min: 1 }),
  body('curriculum').optional(optionalField).trim().isLength({ max: 150 }),
  body('subject').optional(optionalField).trim().isLength({ max: 150 }),
  body('weekNo').optional(optionalField).isInt({ min: 1 }),
  body('topic').optional(optionalField).trim().isLength({ max: 255 }),
  body('description').optional(optionalField).trim().isLength({ max: 1000 }),
  body('visibility').optional(optionalField).isIn(['public', 'private', 'restricted', 'draft']),
  body('audience').optional(optionalField).isIn(audienceValues),
  body('status').optional(optionalField).isIn(['active', 'archived', 'draft']),
  body('tags').optional(optionalField).trim().isLength({ max: 500 }),
  body('departmentIds').optional(optionalField).custom(departmentIdsValidator).withMessage('Department IDs must be valid'),
];

export const supportedExtensions = allManagedFileExtensions.join(', ');

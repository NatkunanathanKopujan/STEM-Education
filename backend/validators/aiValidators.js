import { body, query } from 'express-validator';

const optionalId = (field) =>
  body(field).optional({ nullable: true }).isInt({ min: 1 }).withMessage(`${field} must be a valid ID`);

export const aiMaterialValidator = [
  optionalId('materialId'),
  optionalId('curriculumId'),
  optionalId('courseId'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('weekNo').isInt({ min: 1 }).withMessage('Week number must be a positive integer'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('sourceType')
    .isIn([
      'pdf',
      'ppt',
      'pptx',
      'doc',
      'docx',
      'teacher_note',
      'lesson_description',
      'video_description',
      'weekly_plan',
    ])
    .withMessage('Source type is not supported'),
  body().custom((value, { req }) => {
    if (!value.text && !value.description && !value.extractedText && !req.file) {
      throw new Error('Learning text, description, or extracted text is required');
    }

    return true;
  }),
];

export const aiKnowledgeValidator = [
  optionalId('materialId'),
  optionalId('curriculumId'),
  optionalId('courseId'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('weekNo').isInt({ min: 1 }).withMessage('Week number must be a positive integer'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('sourceType')
    .isIn([
      'pdf',
      'ppt',
      'pptx',
      'doc',
      'docx',
      'teacher_note',
      'lesson_description',
      'video_description',
      'weekly_plan',
    ])
    .withMessage('Source type is not supported'),
  body('extractedText').optional().trim(),
  body().custom((value, { req }) => {
    if (!value.extractedText && !req.file) {
      throw new Error('Extracted text or a supported file is required');
    }

    return true;
  }),
];

export const aiTopicValidator = [
  optionalId('curriculumId'),
  optionalId('courseId'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('weekNo').isInt({ min: 1 }).withMessage('Week number must be a positive integer'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('status').isIn(['completed', 'upcoming']).withMessage('Topic status must be completed or upcoming'),
];

export const aiListValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be zero or greater'),
];

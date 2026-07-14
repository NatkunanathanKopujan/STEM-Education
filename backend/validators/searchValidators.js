import { body, param, query } from 'express-validator';

export const searchQueryValidator = [
  query('q').optional().trim().isLength({ max: 255 }),
  query('category')
    .optional()
    .isIn([
      'users',
      'admins',
      'teachers',
      'students',
      'curriculums',
      'subjects',
      'lessons',
      'completed_topics',
      'materials',
      'learning_materials',
      'pdf_files',
      'ppt_files',
      'doc_files',
      'videos',
      'teacher_notes',
      'topics',
      'announcements',
      'quizzes',
      'quiz_results',
      'reports',
      'notifications',
    ]),
  query('academicYear').optional().trim(),
  query('semester').optional().trim(),
  query('department').optional().trim(),
  query('curriculum').optional().trim(),
  query('subject').optional().trim(),
  query('teacher').optional().trim(),
  query('student').optional().trim(),
  query('weekNo').optional().isInt({ min: 1 }),
  query('topic').optional().trim(),
  query('completedTopic').optional().isBoolean(),
  query('status').optional().trim(),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('quizNumber').optional().isInt({ min: 1 }),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('uploadDate').optional().isISO8601(),
  query('fileType').optional().trim(),
  query('createdBy').optional().trim(),
  query('role').optional().isIn(['super-admin', 'admin', 'teacher', 'student']),
  query('sort').optional().isIn(['newest', 'oldest', 'az', 'za', 'relevance']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const saveSearchValidator = [
  body('name').trim().isLength({ min: 2, max: 120 }),
  body('searchTerm').trim().isLength({ min: 1, max: 255 }),
  body('filters').optional().isObject(),
  body('isPinned').optional().isBoolean(),
];

export const updateSavedSearchValidator = [
  param('id').isInt({ min: 1 }),
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('searchTerm').optional().trim().isLength({ min: 1, max: 255 }),
  body('filters').optional().isObject(),
  body('isPinned').optional().isBoolean(),
];

export const savedSearchIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Saved search ID must be valid'),
];

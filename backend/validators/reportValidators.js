import { body, query } from 'express-validator';

export const reportFilterValidator = [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('academicYear').optional().trim(),
  query('semester').optional().trim(),
  query('curriculumId').optional().isInt({ min: 1 }),
  query('subject').optional().trim(),
  query('teacherId').optional().isInt({ min: 1 }),
  query('studentId').optional().isInt({ min: 1 }),
  query('department').optional().trim(),
  query('quizNumber').optional().isInt({ min: 1 }),
  query('weekNo').optional().isInt({ min: 1 }),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('status').optional().trim(),
  query('search').optional().trim(),
];

export const reportExportValidator = [
  body('reportType')
    .optional()
    .isIn(['dashboard', 'students', 'teachers', 'quizzes', 'materials', 'ai']),
  body('format').optional().isIn(['pdf', 'excel', 'csv']),
  body('scope')
    .optional()
    .isIn([
      'current_page',
      'filtered_data',
      'complete_report',
      'selected_students',
      'selected_teachers',
      'date_range',
    ]),
  body('filters').optional().isObject(),
];

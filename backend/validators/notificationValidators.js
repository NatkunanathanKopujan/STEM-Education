import { body, param, query } from 'express-validator';

export const notificationQueryValidator = [
  query('search').optional().trim(),
  query('type')
    .optional()
    .isIn(['system', 'academic', 'quiz', 'material', 'announcement', 'security', 'reminder']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
];

export const readNotificationsValidator = [
  body('ids').optional().isArray(),
  body('ids.*').optional().isInt({ min: 1 }),
];

export const notificationIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Notification ID must be valid'),
];

export const announcementValidator = [
  body('title').trim().isLength({ min: 3, max: 180 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 5 }).withMessage('Description is required'),
  body('audienceRole')
    .optional({ nullable: true })
    .isIn(['super-admin', 'admin', 'teacher', 'student']),
  body('priority').optional().isIn(['normal', 'important', 'urgent']),
  body('status').optional().isIn(['draft', 'published', 'expired']),
  body('publishDate').optional({ nullable: true }).isISO8601(),
  body('expiryDate').optional({ nullable: true }).isISO8601(),
  body('targets').optional().isArray(),
  body('targets.*.targetType')
    .optional()
    .isIn(['all_users', 'role', 'curriculum', 'batch', 'teacher', 'student']),
  body('targets.*.targetRole')
    .optional({ nullable: true })
    .isIn(['super-admin', 'admin', 'teacher', 'student']),
  body('targets.*.targetId').optional({ nullable: true }).isInt({ min: 1 }),
];

export const announcementIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Announcement ID must be valid'),
];

export const preferencesValidator = [
  body('quizNotifications').optional().isBoolean(),
  body('announcementNotifications').optional().isBoolean(),
  body('materialUploadNotifications').optional().isBoolean(),
  body('reminderNotifications').optional().isBoolean(),
  body('securityNotifications').optional().isBoolean(),
  body('emailNotifications').optional().isBoolean(),
  body('pushNotifications').optional().isBoolean(),
  body('smsNotifications').optional().isBoolean(),
];

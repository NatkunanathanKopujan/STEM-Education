import { body, param, query } from 'express-validator';

const optionalField = { values: 'falsy' };
const targetIdTypes = ['curriculum', 'batch', 'teacher', 'student'];

function validateAnnouncementTargets(targets = []) {
  if (!Array.isArray(targets)) {
    return true;
  }

  targets.forEach((target) => {
    if (target?.targetType === 'role' && !target.targetRole) {
      throw new Error('Target role is required when target type is role');
    }

    if (targetIdTypes.includes(target?.targetType) && !target.targetId) {
      throw new Error('Target ID is required for the selected target type');
    }
  });

  return true;
}

export const notificationQueryValidator = [
  query('search').optional(optionalField).trim(),
  query('type')
    .optional(optionalField)
    .isIn(['system', 'academic', 'quiz', 'material', 'announcement', 'security', 'reminder']),
  query('readStatus').optional(optionalField).isIn(['read', 'unread']),
  query('priority').optional(optionalField).isIn(['normal', 'important', 'urgent']),
  query('limit').optional(optionalField).isInt({ min: 1, max: 100 }),
  query('offset').optional(optionalField).isInt({ min: 0 }),
];

export const announcementQueryValidator = [
  query('search').optional(optionalField).trim(),
  query('priority').optional(optionalField).isIn(['normal', 'important', 'urgent']),
  query('status').optional(optionalField).isIn(['draft', 'published', 'expired']),
  query('limit').optional(optionalField).isInt({ min: 1, max: 100 }),
  query('offset').optional(optionalField).isInt({ min: 0 }),
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
    .optional({ nullable: true, values: 'falsy' })
    .isIn(['super-admin', 'admin', 'teacher', 'student']),
  body('priority').optional(optionalField).isIn(['normal', 'important', 'urgent']),
  body('status').optional(optionalField).isIn(['draft', 'published', 'expired']),
  body('publishDate').optional({ nullable: true, values: 'falsy' }).isISO8601(),
  body('expiryDate').optional({ nullable: true, values: 'falsy' }).isISO8601(),
  body('targets').optional().isArray().custom(validateAnnouncementTargets),
  body('targets.*.targetType')
    .optional(optionalField)
    .isIn(['all_users', 'role', 'curriculum', 'batch', 'teacher', 'student']),
  body('targets.*.targetRole')
    .optional({ nullable: true, values: 'falsy' })
    .isIn(['super-admin', 'admin', 'teacher', 'student']),
  body('targets.*.targetId').optional({ nullable: true, values: 'falsy' }).isInt({ min: 1 }),
];

export const announcementUpdateValidator = [
  body('title').optional(optionalField).trim().isLength({ min: 3, max: 180 }).withMessage('Title must be 3 to 180 characters'),
  body('description').optional(optionalField).trim().isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('audienceRole')
    .optional({ nullable: true, values: 'falsy' })
    .isIn(['super-admin', 'admin', 'teacher', 'student']),
  body('priority').optional(optionalField).isIn(['normal', 'important', 'urgent']),
  body('status').optional(optionalField).isIn(['draft', 'published', 'expired']),
  body('publishDate').optional({ nullable: true, values: 'falsy' }).isISO8601(),
  body('expiryDate').optional({ nullable: true, values: 'falsy' }).isISO8601(),
  body('targets').optional().isArray().custom(validateAnnouncementTargets),
  body('targets.*.targetType')
    .optional(optionalField)
    .isIn(['all_users', 'role', 'curriculum', 'batch', 'teacher', 'student']),
  body('targets.*.targetRole')
    .optional({ nullable: true, values: 'falsy' })
    .isIn(['super-admin', 'admin', 'teacher', 'student']),
  body('targets.*.targetId').optional({ nullable: true, values: 'falsy' }).isInt({ min: 1 }),
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

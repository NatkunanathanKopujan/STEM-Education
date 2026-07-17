import { body, param, query } from 'express-validator';

export const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be 2 to 120 characters'),
  body('email')
    .optional({ nullable: true, values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional({ nullable: true, values: 'falsy' })
    .trim()
    .matches(/^[+()\-\s0-9]{6,30}$/)
    .withMessage('Phone number must be 6 to 30 digits or phone symbols'),
  body('address').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 255 }),
  body('bio').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('department').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 120 }),
  body('qualification').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 180 }),
  body('curriculum').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 180 }),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match'),
];

export const historyValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['successful', 'failed']),
];

export const sessionIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Session ID must be valid'),
];

export const preferencesValidator = [
  body('themePreference').optional().isIn(['light', 'dark', 'system']),
  body('languagePreference').optional().isIn(['en', 'ta', 'si']),
  body('timezone').optional({ nullable: true }).trim().isLength({ max: 80 }),
  body('preferences.profileVisibility').optional().isIn(['private', 'role_members', 'public']),
  body('preferences.phoneVisibility').optional().isBoolean(),
  body('preferences.emailVisibility').optional().isBoolean(),
  body('notificationPreferences').optional().isObject(),
];

export const deleteSessionsValidator = [
  body('keepCurrent').optional().isBoolean(),
  body('password').optional().isString(),
];

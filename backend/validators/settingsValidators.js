import { body, param, query } from 'express-validator';

const keyPattern = /^[a-zA-Z][a-zA-Z0-9_.-]{1,119}$/;

export const settingsListValidator = [
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
  query('offset').optional({ values: 'falsy' }).isInt({ min: 0 }),
];

export const settingKeyValidator = [
  param('settingKey')
    .matches(keyPattern)
    .withMessage('Setting key must start with a letter and contain only letters, numbers, dot, dash, or underscore'),
];

export const createSettingValidator = [
  body('settingKey')
    .matches(keyPattern)
    .withMessage('Setting key must start with a letter and contain only letters, numbers, dot, dash, or underscore'),
  body('settingValue').exists().withMessage('Setting value is required'),
  body('description').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 255 }),
];

export const updateSettingValidator = [
  body('settingValue').exists().withMessage('Setting value is required'),
  body('description').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 255 }),
];

export const bulkSettingsValidator = [
  body('settings').isArray({ min: 1 }).withMessage('Settings must be a non-empty array'),
  body('settings.*.settingKey')
    .matches(keyPattern)
    .withMessage('Setting key must start with a letter and contain only letters, numbers, dot, dash, or underscore'),
  body('settings.*.settingValue').exists().withMessage('Setting value is required'),
  body('settings.*.description')
    .optional({ nullable: true, values: 'falsy' })
    .trim()
    .isLength({ max: 255 }),
];

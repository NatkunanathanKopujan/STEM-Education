import { body } from 'express-validator';

export const loginValidator = [
  body('identifier')
    .optional()
    .trim()
    .isLength({ min: 3, max: 160 })
    .withMessage('Username or email must be between 3 and 160 characters'),
  body('email').optional().isEmail().withMessage('A valid email address is required'),
  body('username')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9._-]{3,60}$/)
    .withMessage('Username format is invalid'),
  body().custom((value) => {
    if (!value.identifier && !value.email && !value.username) {
      throw new Error('Username or email is required');
    }

    return true;
  }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }

    return true;
  }),
];

export const forgotPasswordValidator = [
  body('identifier')
    .trim()
    .isLength({ min: 3, max: 160 })
    .withMessage('Username or email is required'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }

    return true;
  }),
];

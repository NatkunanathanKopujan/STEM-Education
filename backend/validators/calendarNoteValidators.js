import { body, param, query } from 'express-validator';

export const calendarNoteQueryValidator = [
  query('month')
    .optional({ values: 'falsy' })
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must use YYYY-MM format'),
];

export const calendarNoteDateValidator = [
  param('noteDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Note date must use YYYY-MM-DD format'),
];

export const calendarNoteSaveValidator = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be 1 to 1000 characters'),
];

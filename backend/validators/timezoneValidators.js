import { body, param, query } from 'express-validator';

const timezoneNamePattern = /^[A-Za-z]+(?:[A-Za-z0-9_+-]*)(?:\/[A-Za-z0-9_+-]+)*$/;
const utcOffsetPattern = /^UTC(?:[+-](?:0\d|1[0-4]):[0-5]\d)?$/;

export const timezoneListValidator = [
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  query('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
  query('offset').optional({ values: 'falsy' }).isInt({ min: 0 }),
];

export const timezoneIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('Timezone id must be a positive integer'),
];

export const timezonePayloadValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Timezone name is required')
    .isLength({ max: 80 })
    .withMessage('Timezone name must be 80 characters or less')
    .matches(timezoneNamePattern)
    .withMessage('Use a valid timezone name like Asia/Colombo or UTC'),
  body('utcOffset')
    .optional({ nullable: true, values: 'falsy' })
    .trim()
    .matches(utcOffsetPattern)
    .withMessage('UTC offset must look like UTC, UTC+05:30, or UTC-04:00'),
  body('status').optional({ values: 'falsy' }).isIn(['active', 'inactive']),
  body('isDefault').optional().isBoolean().toBoolean(),
  body('description').optional({ nullable: true, values: 'falsy' }).trim().isLength({ max: 255 }),
];

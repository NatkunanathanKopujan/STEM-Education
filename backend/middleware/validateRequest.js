import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

export function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return sendError(res, 'Validation failed', 422, errors.array());
}

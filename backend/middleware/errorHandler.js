import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(error.message, { stack: error.stack });
  }

  return sendError(
    res,
    statusCode === 500 ? 'Internal server error' : error.message,
    statusCode,
    error.errors || [],
  );
}

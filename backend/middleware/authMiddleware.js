import { isUserSessionActive, touchUserSession } from '../models/sessionModel.js';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/apiResponse.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return sendError(res, 'Authentication token is required', 401);
  }

  try {
    req.token = token;
    req.user = verifyToken(token);

    if (!(await isUserSessionActive({ sessionId: req.user.sessionId, userId: req.user.id }))) {
      return sendError(res, 'Session has expired. Please login again.', 401);
    }

    await touchUserSession({ sessionId: req.user.sessionId, userId: req.user.id });

    return next();
  } catch (error) {
    return sendError(res, error.message || 'Invalid or expired authentication token', 401);
  }
}

export const checkLogin = authenticate;
export const authenticateUser = authenticate;

export function protect(req, res, next) {
  return authenticate(req, res, next);
}

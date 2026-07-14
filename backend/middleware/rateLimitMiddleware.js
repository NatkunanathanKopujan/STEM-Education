import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

const buckets = new Map();

function rateLimit(req, res, next, { keyPrefix, windowMs, max }) {
  const key = `${keyPrefix}:${req.ip}:${req.path}`;
  const now = Date.now();
  const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;
  buckets.set(key, current);

  if (current.count > max) {
    return sendError(res, 'Too many requests. Please try again later.', 429);
  }

  return next();
}

export function apiRateLimiter(req, res, next) {
  return rateLimit(req, res, next, {
    keyPrefix: 'api',
    windowMs: env.security.apiRateLimitWindowMs,
    max: env.security.apiRateLimitMax,
  });
}

export function loginRateLimiter(req, res, next) {
  return rateLimit(req, res, next, {
    keyPrefix: 'login',
    windowMs: env.security.lockoutWindowMinutes * 60 * 1000,
    max: env.security.maxFailedLogins * 3,
  });
}

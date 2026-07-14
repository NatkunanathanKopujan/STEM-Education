import crypto from 'crypto';
import { env } from '../config/env.js';
import { cacheKey, cacheService } from '../services/cacheService.js';
import { performanceMetricsService } from '../services/performanceMetricsService.js';

function normalizeQuery(query = {}) {
  return Object.keys(query)
    .sort()
    .reduce((normalized, key) => {
      normalized[key] = query[key];
      return normalized;
    }, {});
}

export function performanceMonitor(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const metric = {
      method: req.method,
      path: req.route?.path || req.path,
      originalUrl: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id || null,
    };

    performanceMetricsService.recordApiRequest(metric);

    if (durationMs >= env.performance.slowRequestThresholdMs) {
      performanceMetricsService.recordSlowRequest(metric);
    }
  });

  next();
}

export function cacheHeaders(req, res, next) {
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  const isAuthenticatedApi = req.originalUrl.startsWith('/api');
  res.setHeader('Cache-Control', isAuthenticatedApi ? 'private, max-age=30' : 'public, max-age=300');
  res.setHeader('Vary', 'Authorization, Accept-Encoding');

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const etag = crypto.createHash('sha1').update(JSON.stringify(body)).digest('hex');
    res.setHeader('ETag', `"${etag}"`);

    if (req.headers['if-none-match'] === `"${etag}"`) {
      return res.status(304).end();
    }

    return originalJson(body);
  };

  return next();
}

export function apiCache({ namespace = 'api', ttlSeconds = env.performance.cacheDefaultTtlSeconds } = {}) {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = cacheKey(namespace, {
      userId: req.user?.id || null,
      role: req.user?.role || null,
      path: req.originalUrl.split('?')[0],
      query: normalizeQuery(req.query),
    });
    const cached = cacheService.get(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(cached.statusCode).json(cached.body);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      const statusCode = res.statusCode || body?.statusCode || 200;
      const isCacheable = statusCode >= 200 && statusCode < 300 && body?.success !== false;

      if (isCacheable) {
        cacheService.set(key, { statusCode, body }, ttlSeconds);
      }

      return originalJson(body);
    };

    return next();
  };
}

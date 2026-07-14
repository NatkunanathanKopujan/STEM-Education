import { describe, expect, test } from '@jest/globals';
import { apiCache } from '../../middleware/performanceMiddleware.js';
import { cacheKey, cacheService } from '../../services/cacheService.js';
import { performanceMetricsService } from '../../services/performanceMetricsService.js';
import { createMockNext, createMockResponse } from '../helpers/http.js';

describe('cache and performance services', () => {
  test('stores and returns cached values', async () => {
    const key = cacheKey('unit', { id: 1 });
    cacheService.set(key, { ok: true }, 30);

    expect(cacheService.get(key)).toEqual({ ok: true });
    expect(cacheService.stats().hits).toBeGreaterThanOrEqual(1);
  });

  test('records API and AI metrics', () => {
    performanceMetricsService.recordApiRequest({
      method: 'GET',
      originalUrl: '/api/test',
      statusCode: 200,
      durationMs: 42,
    });
    performanceMetricsService.recordAiProcessing({ durationMs: 120, generated: 4 });

    const dashboard = performanceMetricsService.getDashboard();

    expect(dashboard.api.totalRequests).toBeGreaterThanOrEqual(1);
    expect(dashboard.ai.totalOperations).toBeGreaterThanOrEqual(1);
  });

  test('caches successful GET API responses by user and query', () => {
    const middleware = apiCache({ namespace: 'unit:api', ttlSeconds: 30 });
    const req = {
      method: 'GET',
      originalUrl: '/api/unit?b=2&a=1',
      query: { b: '2', a: '1' },
      user: { id: 7, role: 'super-admin' },
    };
    const res = createMockResponse();
    const next = createMockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    res.status(200).json({ success: true, data: { ok: true }, statusCode: 200 });

    const cachedRes = createMockResponse();
    middleware(req, cachedRes, createMockNext());

    expect(cachedRes.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(cachedRes.status).toHaveBeenCalledWith(200);
    expect(cachedRes.json).toHaveBeenCalledWith({ success: true, data: { ok: true }, statusCode: 200 });
  });
});

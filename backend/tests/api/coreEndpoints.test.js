import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import app from '../../app.js';

describe('Core API endpoints', () => {
  test('health endpoint returns the standard API response format', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Success',
      statusCode: 200,
    });
    expect(response.body.data.service).toBe('AI Smart LMS API');
  });

  test('protected auth endpoint rejects missing token', async () => {
    const response = await request(app).get('/api/auth/me').expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Authentication token/i);
  });

  test('unknown API route returns 404 response', async () => {
    const response = await request(app).get('/api/not-a-real-route').expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.statusCode).toBe(404);
  });
});

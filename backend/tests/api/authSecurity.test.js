import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import app from '../../app.js';
import { expectStandardResponse, expectValidationError } from '../helpers/api.js';

describe('Authentication and security API contracts', () => {
  test('health endpoint includes production security and cache headers', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers.etag).toMatch(/^".+"$/);
    expect(response.headers['cache-control']).toContain('public');
    expectStandardResponse(response.body, { success: true, statusCode: 200 });
  });

  test('login validation rejects missing identifier and short password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ password: 'short' })
      .expect(422);

    expectStandardResponse(response.body, { success: false, statusCode: 422 });
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'password' }),
        expect.objectContaining({ path: '' }),
      ]),
    );
  });

  test('protected endpoint rejects malformed token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);

    expectStandardResponse(response.body, { success: false, statusCode: 401 });
    expect(response.body.message).toMatch(/invalid/i);
  });

  test('logout is protected by JWT authentication', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect(401);

    expectStandardResponse(response.body, { success: false, statusCode: 401 });
    expect(response.body.message).toMatch(/token/i);
  });

  test('forgot password validates identifier before future-ready response', async () => {
    const invalid = await request(app)
      .post('/api/auth/forgot-password')
      .send({ identifier: 'ab' })
      .expect(422);

    expectValidationError(invalid.body, 'identifier');

    const valid = await request(app)
      .post('/api/auth/forgot-password')
      .send({ identifier: 'student@example.com' })
      .expect(200);

    expectStandardResponse(valid.body, { success: true, statusCode: 200 });
    expect(valid.body.message).toMatch(/password reset instructions/i);
  });

  test('reset password validates token and password confirmation', async () => {
    const invalid = await request(app)
      .post('/api/auth/reset-password')
      .send({ newPassword: 'Password123', confirmPassword: 'Mismatch123' })
      .expect(422);

    expectStandardResponse(invalid.body, { success: false, statusCode: 422 });
    expect(invalid.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'token' }),
        expect.objectContaining({ path: 'confirmPassword' }),
      ]),
    );

    const valid = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'future-reset-token',
        newPassword: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(200);

    expectStandardResponse(valid.body, { success: true, statusCode: 200 });
    expect(valid.body.message).toMatch(/ready/i);
  });
});

import { describe, expect, test } from '@jest/globals';
import { decodeToken, generateToken, verifyToken } from '../../utils/jwt.js';

describe('JWT utilities', () => {
  test('generates and verifies a token payload', () => {
    const token = generateToken({ id: 1, role: 'super-admin' });
    const verified = verifyToken(token);

    expect(verified.id).toBe(1);
    expect(verified.role).toBe('super-admin');
    expect(decodeToken(token).id).toBe(1);
  });

  test('throws for invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow('Authentication token is invalid');
  });
});

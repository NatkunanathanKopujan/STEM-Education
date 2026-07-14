import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './appError.js';

export const signToken = (payload) =>
  jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

export const generateToken = signToken;

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Authentication token has expired', 401);
    }

    throw new AppError('Authentication token is invalid', 401);
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}

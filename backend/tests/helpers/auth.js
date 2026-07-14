import { generateToken } from '../../utils/jwt.js';

export function bearerToken(user) {
  return `Bearer ${generateToken(user)}`;
}

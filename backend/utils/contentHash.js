import crypto from 'crypto';

export function createContentHash(value = '') {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

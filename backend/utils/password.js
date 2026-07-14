import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password, passwordHash) =>
  bcrypt.compare(password, passwordHash);

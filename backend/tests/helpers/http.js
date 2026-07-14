import { jest } from '@jest/globals';

export function createMockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.end = jest.fn(() => res);
  res.setHeader = jest.fn(() => res);
  return res;
}

export function createMockNext() {
  return jest.fn();
}

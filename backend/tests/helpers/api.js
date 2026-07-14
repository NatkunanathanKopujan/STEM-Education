import { expect } from '@jest/globals';

export function expectStandardResponse(body, { success, statusCode }) {
  expect(body).toEqual(
    expect.objectContaining({
      success,
      statusCode,
      message: expect.any(String),
      timestamp: expect.any(String),
    }),
  );
}

export function expectValidationError(body, fieldName) {
  expectStandardResponse(body, { success: false, statusCode: 422 });
  expect(body.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: fieldName,
      }),
    ]),
  );
}

import { describe, expect, test } from '@jest/globals';
import { authorize, checkPermissions } from '../../middleware/rbacMiddleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import { createMockNext, createMockResponse } from '../helpers/http.js';
import { testUsers } from '../fixtures/users.js';

describe('RBAC middleware', () => {
  test('allows super admin through every role guard', () => {
    const req = { user: testUsers.superAdmin };
    const res = createMockResponse();
    const next = createMockNext();

    authorize('student')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('checks granular permissions', () => {
    const req = { user: testUsers.teacher };
    const res = createMockResponse();
    const next = createMockNext();

    checkPermissions(PERMISSIONS.MATERIALS_WRITE)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

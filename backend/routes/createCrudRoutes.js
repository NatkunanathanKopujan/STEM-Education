import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, checkPermissions } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  emptyBodyValidator,
  idParamValidator,
  paginationValidator,
} from '../validators/commonValidators.js';

export function createCrudRoutes({
  controller,
  allowedRoles = [],
  readPermissions = [],
  writePermissions = [],
}) {
  const router = Router();

  router.use(authenticate);

  if (allowedRoles.length) {
    router.use(authorize(...allowedRoles));
  }

  router.get(
    '/',
    paginationValidator,
    validateRequest,
    readPermissions.length ? checkPermissions(...readPermissions) : (_req, _res, next) => next(),
    controller.index,
  );
  router.get(
    '/:id',
    idParamValidator,
    validateRequest,
    readPermissions.length ? checkPermissions(...readPermissions) : (_req, _res, next) => next(),
    controller.show,
  );
  router.post(
    '/',
    emptyBodyValidator,
    validateRequest,
    writePermissions.length ? checkPermissions(...writePermissions) : (_req, _res, next) => next(),
    controller.create,
  );
  router.put(
    '/:id',
    idParamValidator,
    validateRequest,
    writePermissions.length ? checkPermissions(...writePermissions) : (_req, _res, next) => next(),
    controller.update,
  );
  router.delete(
    '/:id',
    idParamValidator,
    validateRequest,
    writePermissions.length ? checkPermissions(...writePermissions) : (_req, _res, next) => next(),
    controller.remove,
  );

  return router;
}

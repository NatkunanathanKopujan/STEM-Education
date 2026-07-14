import { Router } from 'express';
import { moduleStatus } from '../controllers/baseController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';

export function createModuleRouter(moduleName, allowedRoles = []) {
  const router = Router();

  router.use(authenticate);

  if (allowedRoles.length) {
    router.use(authorize(...allowedRoles));
  }

  router.get('/', moduleStatus(moduleName));

  return router;
}

import { Router } from 'express';
import { PERMISSIONS } from '../config/permissions.js';
import { ROLES } from '../config/roles.js';
import { departmentController } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, checkPermissions } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  departmentCreateValidator,
  departmentIdValidator,
  departmentQueryValidator,
  departmentUpdateValidator,
} from '../validators/departmentValidators.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get(
  '/',
  departmentQueryValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.USERS_READ),
  departmentController.index,
);
router.get(
  '/:id',
  departmentIdValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.USERS_READ),
  departmentController.show,
);
router.post(
  '/',
  departmentCreateValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.USERS_WRITE),
  departmentController.create,
);
router.put(
  '/:id',
  departmentIdValidator,
  departmentUpdateValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.USERS_WRITE),
  departmentController.update,
);
router.delete(
  '/:id',
  departmentIdValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.USERS_WRITE),
  departmentController.remove,
);

export default router;

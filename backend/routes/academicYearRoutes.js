import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { academicYearController } from '../controllers/academicYearController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, checkPermissions } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  academicYearIdValidator,
  academicYearListValidator,
  academicYearPayloadValidator,
} from '../validators/academicYearValidators.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/', academicYearListValidator, validateRequest, academicYearController.index);
router.post(
  '/',
  academicYearPayloadValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  academicYearController.create,
);
router.get('/:id', academicYearIdValidator, validateRequest, academicYearController.show);
router.put(
  '/:id',
  academicYearIdValidator,
  academicYearPayloadValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  academicYearController.update,
);
router.delete(
  '/:id',
  academicYearIdValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  academicYearController.remove,
);

export default router;

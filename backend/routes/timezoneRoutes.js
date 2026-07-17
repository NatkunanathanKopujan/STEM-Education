import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { timezoneController } from '../controllers/timezoneController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize, checkPermissions } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  timezoneIdValidator,
  timezoneListValidator,
  timezonePayloadValidator,
} from '../validators/timezoneValidators.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/', timezoneListValidator, validateRequest, timezoneController.index);
router.post(
  '/',
  timezonePayloadValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  timezoneController.create,
);
router.get('/:id', timezoneIdValidator, validateRequest, timezoneController.show);
router.put(
  '/:id',
  timezoneIdValidator,
  timezonePayloadValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  timezoneController.update,
);
router.delete(
  '/:id',
  timezoneIdValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  timezoneController.remove,
);

export default router;

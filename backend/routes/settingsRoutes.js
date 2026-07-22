import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { PERMISSIONS } from '../config/permissions.js';
import { settingsController } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadFor } from '../middleware/uploadMiddleware.js';
import { authorize, checkPermissions } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  bulkSettingsValidator,
  createSettingValidator,
  settingKeyValidator,
  settingsListValidator,
  updateSettingValidator,
} from '../validators/settingsValidators.js';

const router = Router();

router.use(authenticate);
router.get('/public/support', settingsController.publicSupport);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN));

router.get('/', settingsListValidator, validateRequest, settingsController.index);
router.put(
  '/',
  bulkSettingsValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  settingsController.bulkUpdate,
);
router.post(
  '/',
  createSettingValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  settingsController.create,
);
router.post(
  '/logo',
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  uploadFor('settings', 'logo'),
  settingsController.uploadLogo,
);
router.get('/:settingKey', settingKeyValidator, validateRequest, settingsController.show);
router.put(
  '/:settingKey',
  settingKeyValidator,
  updateSettingValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  settingsController.update,
);
router.delete(
  '/:settingKey',
  settingKeyValidator,
  validateRequest,
  checkPermissions(PERMISSIONS.SETTINGS_WRITE),
  settingsController.remove,
);

export default router;

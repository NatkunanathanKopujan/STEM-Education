import { Router } from 'express';
import { PERMISSIONS } from '../config/permissions.js';
import { securityController } from '../controllers/securityController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { apiCache } from '../middleware/performanceMiddleware.js';
import { checkPermissions, requireSuperAdmin } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  backupValidator,
  lockUserValidator,
  restoreValidator,
  securityListValidator,
} from '../validators/securityValidators.js';

const router = Router();

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/dashboard', apiCache({ namespace: 'security:dashboard', ttlSeconds: 10 }), securityController.dashboard);
router.get('/audit-logs', securityListValidator, validateRequest, checkPermissions(PERMISSIONS.AUDIT_LOGS_READ), securityController.auditLogs);
router.get('/activity', securityListValidator, validateRequest, checkPermissions(PERMISSIONS.AUDIT_LOGS_READ), securityController.activity);
router.get('/alerts', securityListValidator, validateRequest, securityController.alerts);
router.get('/login-history', securityListValidator, validateRequest, securityController.loginHistory);
router.post('/lock-user', lockUserValidator, validateRequest, securityController.lockUser);
router.post('/unlock-user', lockUserValidator, validateRequest, securityController.unlockUser);
router.post('/backup', backupValidator, validateRequest, checkPermissions(PERMISSIONS.BACKUP_SYSTEM), securityController.backup);
router.get('/backups', securityListValidator, validateRequest, checkPermissions(PERMISSIONS.BACKUP_SYSTEM), securityController.backups);
router.post('/restore', restoreValidator, validateRequest, checkPermissions(PERMISSIONS.RESTORE_BACKUP), securityController.restore);
router.get('/restores', securityListValidator, validateRequest, checkPermissions(PERMISSIONS.RESTORE_BACKUP), securityController.restores);
router.get('/system-health', apiCache({ namespace: 'security:health', ttlSeconds: 10 }), securityController.systemHealth);

export default router;

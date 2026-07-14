import { Router } from 'express';
import { PERMISSIONS } from '../config/permissions.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkPermissions } from '../middleware/rbacMiddleware.js';
import { dashboardController } from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);
router.use(checkPermissions(PERMISSIONS.USERS_READ));

router.get('/summary', dashboardController.summary);
router.get('/users', dashboardController.users);
router.get('/curriculums', checkPermissions(PERMISSIONS.CURRICULUM_READ), dashboardController.curriculums);

export default router;

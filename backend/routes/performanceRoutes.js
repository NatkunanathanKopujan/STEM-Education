import { Router } from 'express';
import { performanceController } from '../controllers/performanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { apiCache } from '../middleware/performanceMiddleware.js';
import { requireSuperAdmin } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/dashboard', apiCache({ namespace: 'performance:dashboard', ttlSeconds: 10 }), performanceController.dashboard);

export default router;

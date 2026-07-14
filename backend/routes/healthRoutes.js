import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

router.get('/', healthController.overall);
router.get('/database', healthController.database);
router.get('/storage', healthController.storage);
router.get('/ai', healthController.ai);
router.get('/system', healthController.system);

export default router;

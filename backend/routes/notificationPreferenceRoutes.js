import { Router } from 'express';
import {
  preferencesController,
  resetPreferencesController,
  updatePreferencesController,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { preferencesValidator } from '../validators/notificationValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', preferencesController);
router.put('/', preferencesValidator, validateRequest, updatePreferencesController);
router.delete('/', resetPreferencesController);

export default router;

import { Router } from 'express';
import {
  changePasswordController,
  deletePhotoController,
  deleteSessionController,
  deleteSessionsController,
  getProfileController,
  loginHistoryController,
  preferencesController,
  resetPreferencesController,
  sessionsController,
  updatePreferencesController,
  updateProfileController,
  uploadPhotoController,
} from '../controllers/profileController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadFor } from '../middleware/uploadMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  changePasswordValidator,
  deleteSessionsValidator,
  historyValidator,
  preferencesValidator,
  sessionIdValidator,
  updateProfileValidator,
} from '../validators/profileValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfileController);
router.put('/', updateProfileValidator, validateRequest, updateProfileController);
router.post('/upload-photo', uploadFor('profiles', 'photo'), uploadPhotoController);
router.delete('/photo', deletePhotoController);
router.put('/change-password', changePasswordValidator, validateRequest, changePasswordController);
router.get('/login-history', historyValidator, validateRequest, loginHistoryController);
router.get('/sessions', sessionsController);
router.delete('/sessions/:id', sessionIdValidator, validateRequest, deleteSessionController);
router.delete('/sessions', deleteSessionsValidator, validateRequest, deleteSessionsController);
router.get('/preferences', preferencesController);
router.put('/preferences', preferencesValidator, validateRequest, updatePreferencesController);
router.delete('/preferences', resetPreferencesController);

export default router;

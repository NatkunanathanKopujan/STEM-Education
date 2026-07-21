import { Router } from 'express';
import {
  announcementDetailsController,
  announcementsController,
  createAnnouncementController,
  deleteAnnouncementController,
  updateAnnouncementController,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  announcementIdValidator,
  announcementQueryValidator,
  announcementUpdateValidator,
  announcementValidator,
} from '../validators/notificationValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', announcementQueryValidator, validateRequest, announcementsController);
router.get('/:id', announcementIdValidator, validateRequest, announcementDetailsController);
router.post('/', announcementValidator, validateRequest, createAnnouncementController);
router.put('/:id', announcementIdValidator, announcementUpdateValidator, validateRequest, updateAnnouncementController);
router.delete('/:id', announcementIdValidator, validateRequest, deleteAnnouncementController);

export default router;

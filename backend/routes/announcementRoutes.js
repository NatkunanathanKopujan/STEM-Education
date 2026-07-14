import { Router } from 'express';
import {
  announcementsController,
  createAnnouncementController,
  deleteAnnouncementController,
  updateAnnouncementController,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  announcementIdValidator,
  announcementValidator,
  notificationQueryValidator,
} from '../validators/notificationValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationQueryValidator, validateRequest, announcementsController);
router.post('/', announcementValidator, validateRequest, createAnnouncementController);
router.put('/:id', announcementIdValidator, announcementValidator, validateRequest, updateAnnouncementController);
router.delete('/:id', announcementIdValidator, validateRequest, deleteAnnouncementController);

export default router;

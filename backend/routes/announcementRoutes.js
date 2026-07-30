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
import { uploadFor } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(authenticate);

function parseMultipartJsonFields(req, _res, next) {
  if (typeof req.body.targets === 'string') {
    try {
      req.body.targets = JSON.parse(req.body.targets);
    } catch {
      req.body.targets = [];
    }
  }

  return next();
}

router.get('/', announcementQueryValidator, validateRequest, announcementsController);
router.get('/:id', announcementIdValidator, validateRequest, announcementDetailsController);
router.post(
  '/',
  uploadFor('announcements', 'attachments', { multiple: true, maxCount: 10 }),
  parseMultipartJsonFields,
  announcementValidator,
  validateRequest,
  createAnnouncementController,
);
router.put('/:id', announcementIdValidator, announcementUpdateValidator, validateRequest, updateAnnouncementController);
router.delete('/:id', announcementIdValidator, validateRequest, deleteAnnouncementController);

export default router;

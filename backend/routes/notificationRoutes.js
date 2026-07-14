import { Router } from 'express';
import {
  deleteNotificationController,
  notificationsController,
  readAllNotificationsController,
  readNotificationsController,
  unreadNotificationsController,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  notificationIdValidator,
  notificationQueryValidator,
  readNotificationsValidator,
} from '../validators/notificationValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationQueryValidator, validateRequest, notificationsController);
router.get('/unread', unreadNotificationsController);
router.post('/read', readNotificationsValidator, validateRequest, readNotificationsController);
router.post('/read-all', readAllNotificationsController);
router.delete('/:id', notificationIdValidator, validateRequest, deleteNotificationController);

export default router;

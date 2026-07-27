import { Router } from 'express';
import {
  calendarNotesController,
  deleteCalendarNoteController,
  saveCalendarNoteController,
} from '../controllers/calendarNoteController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  calendarNoteDateValidator,
  calendarNoteQueryValidator,
  calendarNoteSaveValidator,
} from '../validators/calendarNoteValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', calendarNoteQueryValidator, validateRequest, calendarNotesController);
router.put(
  '/:noteDate',
  calendarNoteDateValidator,
  calendarNoteSaveValidator,
  validateRequest,
  saveCalendarNoteController,
);
router.delete('/:noteDate', calendarNoteDateValidator, validateRequest, deleteCalendarNoteController);

export default router;

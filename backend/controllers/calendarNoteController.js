import {
  getCalendarNotes,
  removeCalendarNote,
  saveCalendarNote,
} from '../services/calendarNoteService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function calendarNotesController(req, res, next) {
  try {
    return sendSuccess(res, await getCalendarNotes(req.user, req.query), 'Calendar notes fetched');
  } catch (error) {
    return next(error);
  }
}

export async function saveCalendarNoteController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await saveCalendarNote(req.user, req.params.noteDate, req.body),
      'Calendar note saved',
    );
  } catch (error) {
    return next(error);
  }
}

export async function deleteCalendarNoteController(req, res, next) {
  try {
    return sendSuccess(
      res,
      await removeCalendarNote(req.user, req.params.noteDate),
      'Calendar note deleted',
    );
  } catch (error) {
    return next(error);
  }
}

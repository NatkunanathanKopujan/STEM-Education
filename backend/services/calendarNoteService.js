import {
  deleteCalendarNote,
  listCalendarNotes,
  upsertCalendarNote,
} from '../repositories/calendarNoteRepository.js';
import { AppError } from '../utils/appError.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-\d{2}$/;

function currentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function assertDate(value) {
  if (!datePattern.test(value)) {
    throw new AppError('Valid note date is required', 400);
  }
}

export async function getCalendarNotes(user, filters = {}) {
  const month = monthPattern.test(filters.month || '') ? filters.month : currentMonthKey();
  const notes = await listCalendarNotes({ userId: user.id, month });
  return { month, notes };
}

export async function saveCalendarNote(user, noteDate, payload = {}) {
  assertDate(noteDate);

  const note = String(payload.note || '').trim();
  if (!note) {
    throw new AppError('Note is required', 400);
  }

  if (note.length > 1000) {
    throw new AppError('Note must be 1000 characters or fewer', 400);
  }

  return upsertCalendarNote({ userId: user.id, noteDate, note });
}

export async function removeCalendarNote(user, noteDate) {
  assertDate(noteDate);
  return { deleted: Boolean(await deleteCalendarNote({ userId: user.id, noteDate })) };
}

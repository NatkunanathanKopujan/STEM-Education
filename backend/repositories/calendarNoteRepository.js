import { db } from '../config/database.js';

let schemaReady = false;

export async function ensureCalendarNoteSchema() {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS calendar_notes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      note_date DATE NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_calendar_notes_user_date (user_id, note_date),
      INDEX idx_calendar_notes_user_date (user_id, note_date),
      CONSTRAINT fk_calendar_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  schemaReady = true;
}

export async function listCalendarNotes({ userId, month }) {
  await ensureCalendarNoteSchema();

  const [year, monthNumber] = month.split('-').map(Number);
  const startDate = `${year}-${String(monthNumber).padStart(2, '0')}-01`;
  const nextMonth = monthNumber === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(monthNumber + 1).padStart(2, '0')}-01`;

  const [rows] = await db.query(
    `SELECT
      id,
      DATE_FORMAT(note_date, '%Y-%m-%d') AS noteDate,
      note,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM calendar_notes
    WHERE user_id = ? AND note_date >= ? AND note_date < ?
    ORDER BY note_date ASC`,
    [userId, startDate, nextMonth],
  );

  return rows;
}

export async function upsertCalendarNote({ userId, noteDate, note }) {
  await ensureCalendarNoteSchema();

  await db.query(
    `INSERT INTO calendar_notes (user_id, note_date, note)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE note = VALUES(note), updated_at = CURRENT_TIMESTAMP`,
    [userId, noteDate, note],
  );

  const [rows] = await db.query(
    `SELECT
      id,
      DATE_FORMAT(note_date, '%Y-%m-%d') AS noteDate,
      note,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM calendar_notes
    WHERE user_id = ? AND note_date = ?
    LIMIT 1`,
    [userId, noteDate],
  );

  return rows[0] || null;
}

export async function deleteCalendarNote({ userId, noteDate }) {
  await ensureCalendarNoteSchema();

  const [result] = await db.query(
    'DELETE FROM calendar_notes WHERE user_id = ? AND note_date = ?',
    [userId, noteDate],
  );

  return result.affectedRows;
}

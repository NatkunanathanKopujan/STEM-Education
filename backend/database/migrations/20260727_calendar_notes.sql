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
);

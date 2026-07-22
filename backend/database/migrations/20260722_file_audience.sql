ALTER TABLE files
  ADD COLUMN audience ENUM('all', 'super-admin', 'admin', 'teacher', 'student') NOT NULL DEFAULT 'all' AFTER visibility;

CREATE INDEX idx_files_audience_status
  ON files (audience, status);

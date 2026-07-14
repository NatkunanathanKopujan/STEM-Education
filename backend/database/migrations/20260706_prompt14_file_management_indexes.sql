CREATE INDEX idx_files_teacher_type_date
  ON files (uploaded_by, file_type, created_at);

CREATE INDEX idx_files_storage_folder
  ON files (storage_provider, logical_folder(191));

CREATE INDEX idx_files_download_view
  ON files (download_count, view_count);

ALTER TABLE file_versions
  ADD COLUMN version_note TEXT NULL;

ALTER TABLE storage_statistics
  ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'local',
  ADD COLUMN role_scope VARCHAR(50) NULL,
  ADD COLUMN generated_by BIGINT UNSIGNED NULL;

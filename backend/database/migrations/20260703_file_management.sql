CREATE TABLE IF NOT EXISTS files (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  mime_type VARCHAR(150),
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  file_path VARCHAR(600) NOT NULL,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  uploaded_by BIGINT UNSIGNED NOT NULL,
  uploaded_role ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  curriculum VARCHAR(150),
  subject VARCHAR(150),
  week_no INT UNSIGNED,
  topic VARCHAR(255),
  logical_folder VARCHAR(700),
  version INT UNSIGNED NOT NULL DEFAULT 1,
  current_version_id BIGINT UNSIGNED NULL,
  description TEXT,
  visibility ENUM('public', 'private', 'restricted', 'draft') NOT NULL DEFAULT 'private',
  status ENUM('active', 'archived', 'draft', 'deleted') NOT NULL DEFAULT 'active',
  tags VARCHAR(500),
  checksum VARCHAR(128),
  download_count INT UNSIGNED NOT NULL DEFAULT 0,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_files_uploaded_by (uploaded_by),
  INDEX idx_files_type_status (file_type, status),
  INDEX idx_files_visibility_status (visibility, status),
  INDEX idx_files_curriculum_subject (curriculum, subject),
  INDEX idx_files_week_topic (week_no, topic),
  INDEX idx_files_created_at (created_at),
  CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id BIGINT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  mime_type VARCHAR(150),
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  file_path VARCHAR(600) NOT NULL,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  uploaded_by BIGINT UNSIGNED NOT NULL,
  description TEXT,
  checksum VARCHAR(128),
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_file_version (file_id, version),
  INDEX idx_file_versions_file_id (file_id),
  INDEX idx_file_versions_uploaded_by (uploaded_by),
  CONSTRAINT fk_file_versions_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_versions_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE files
  ADD CONSTRAINT fk_files_current_version
  FOREIGN KEY (current_version_id) REFERENCES file_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS file_downloads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id BIGINT UNSIGNED NOT NULL,
  downloaded_by BIGINT UNSIGNED NOT NULL,
  download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64),
  device_information JSON,
  INDEX idx_file_downloads_file_id (file_id),
  INDEX idx_file_downloads_user_id (downloaded_by),
  INDEX idx_file_downloads_date (download_date),
  CONSTRAINT fk_file_downloads_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_downloads_user FOREIGN KEY (downloaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_previews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id BIGINT UNSIGNED NOT NULL,
  viewed_by BIGINT UNSIGNED NOT NULL,
  preview_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64),
  device_information JSON,
  INDEX idx_file_previews_file_id (file_id),
  INDEX idx_file_previews_user_id (viewed_by),
  INDEX idx_file_previews_date (preview_date),
  CONSTRAINT fk_file_previews_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_previews_user FOREIGN KEY (viewed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS storage_statistics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  total_files INT UNSIGNED NOT NULL DEFAULT 0,
  total_storage_used BIGINT UNSIGNED NOT NULL DEFAULT 0,
  storage_by_file_type JSON,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_storage_statistics_recorded_at (recorded_at)
);

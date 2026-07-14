CREATE TABLE IF NOT EXISTS generated_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  report_type VARCHAR(120) NOT NULL,
  role_scope ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  generated_by BIGINT UNSIGNED NULL,
  filters JSON NULL,
  payload JSON NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_generated_reports_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_generated_reports_type_role (report_type, role_scope),
  INDEX idx_generated_reports_generated_at (generated_at)
);

CREATE TABLE IF NOT EXISTS report_export_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  report_type VARCHAR(120) NOT NULL,
  export_format ENUM('pdf', 'excel', 'csv') NOT NULL,
  export_scope ENUM('current_page', 'filtered_data', 'complete_report', 'selected_students', 'selected_teachers', 'date_range') NOT NULL DEFAULT 'filtered_data',
  requested_by BIGINT UNSIGNED NULL,
  status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
  file_name VARCHAR(255) NULL,
  filters JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_export_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_report_export_user_created (requested_by, created_at)
);

CREATE TABLE IF NOT EXISTS analytics_cache (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(180) NOT NULL UNIQUE,
  role_scope ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  payload JSON NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_analytics_cache_expiry (expires_at)
);

CREATE TABLE IF NOT EXISTS user_report_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  report_type VARCHAR(120) NOT NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  filters JSON NULL,
  CONSTRAINT fk_user_report_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_report_history_user (user_id, viewed_at)
);

CREATE TABLE IF NOT EXISTS report_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  report_type VARCHAR(120) NOT NULL,
  preferences JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_report_preferences_user_type (user_id, report_type)
);

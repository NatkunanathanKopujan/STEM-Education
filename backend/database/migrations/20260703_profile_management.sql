CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  address VARCHAR(255) NULL,
  bio TEXT NULL,
  department VARCHAR(120) NULL,
  qualification VARCHAR(180) NULL,
  curriculum VARCHAR(180) NULL,
  employee_id VARCHAR(80) NULL,
  student_id VARCHAR(80) NULL,
  phone_visibility TINYINT(1) NOT NULL DEFAULT 1,
  email_visibility TINYINT(1) NOT NULL DEFAULT 1,
  profile_visibility ENUM('private', 'role_members', 'public') NOT NULL DEFAULT 'role_members',
  password_changed_at TIMESTAMP NULL,
  last_failed_login TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  theme_preference ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'light',
  language_preference ENUM('en', 'ta', 'si') NOT NULL DEFAULT 'en',
  timezone VARCHAR(80) NULL,
  preferences JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  login_at TIMESTAMP NULL,
  logout_at TIMESTAMP NULL,
  ip_address VARCHAR(80) NULL,
  browser VARCHAR(160) NULL,
  operating_system VARCHAR(160) NULL,
  location VARCHAR(160) NULL,
  status ENUM('successful', 'failed') NOT NULL DEFAULT 'successful',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_login_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_login_history_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  session_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(255) NULL,
  device_info JSON NULL,
  login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  CONSTRAINT fk_active_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_active_sessions_session FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
  INDEX idx_active_sessions_user (user_id, revoked_at)
);

CREATE TABLE IF NOT EXISTS security_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  ip_address VARCHAR(80) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_security_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_security_events_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS profile_photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(180) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  file_size INT UNSIGNED NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_photos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profile_photos_user_active (user_id, is_active)
);

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS priority ENUM('normal', 'important', 'urgent') NOT NULL DEFAULT 'normal' AFTER audience_role,
  ADD COLUMN IF NOT EXISTS status ENUM('draft', 'published', 'expired') NOT NULL DEFAULT 'draft' AFTER priority,
  ADD COLUMN IF NOT EXISTS expiry_at TIMESTAMP NULL AFTER status;

CREATE TABLE IF NOT EXISTS announcement_targets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('all_users', 'role', 'curriculum', 'batch', 'teacher', 'student') NOT NULL DEFAULT 'all_users',
  target_role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  target_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcement_targets_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  INDEX idx_announcement_targets_scope (target_type, target_role, target_id)
);

CREATE TABLE IF NOT EXISTS announcement_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(180) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcement_attachments_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('system', 'academic', 'quiz', 'material', 'announcement', 'security', 'reminder') NOT NULL DEFAULT 'system',
  priority ENUM('normal', 'important', 'urgent') NOT NULL DEFAULT 'normal',
  source_module VARCHAR(120) NULL,
  action_url VARCHAR(255) NULL,
  status ENUM('active', 'archived', 'deleted') NOT NULL DEFAULT 'active',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read, created_at),
  INDEX idx_notifications_role_type (role, notification_type)
);

CREATE TABLE IF NOT EXISTS notification_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  notification_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('created', 'read', 'deleted', 'archived') NOT NULL,
  event_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON NULL,
  CONSTRAINT fk_notification_history_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_history_user (user_id, event_at)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  quiz_notifications TINYINT(1) NOT NULL DEFAULT 1,
  announcement_notifications TINYINT(1) NOT NULL DEFAULT 1,
  material_upload_notifications TINYINT(1) NOT NULL DEFAULT 1,
  reminder_notifications TINYINT(1) NOT NULL DEFAULT 1,
  security_notifications TINYINT(1) NOT NULL DEFAULT 1,
  email_notifications TINYINT(1) NOT NULL DEFAULT 0,
  push_notifications TINYINT(1) NOT NULL DEFAULT 0,
  sms_notifications TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

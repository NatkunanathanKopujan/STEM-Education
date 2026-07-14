CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  action VARCHAR(120) NOT NULL,
  module VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL,
  ip_address VARCHAR(80),
  browser VARCHAR(255),
  device VARCHAR(255),
  status ENUM('success', 'failed', 'warning') NOT NULL DEFAULT 'success',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_user_created (user_id, created_at),
  INDEX idx_audit_logs_module_action (module, action),
  INDEX idx_audit_logs_status_created (status, created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS security_alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  alert_type VARCHAR(120) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  title VARCHAR(180) NOT NULL,
  description VARCHAR(700) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  source_module VARCHAR(120),
  ip_address VARCHAR(80),
  status ENUM('open', 'acknowledged', 'resolved') NOT NULL DEFAULT 'open',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_security_alerts_status_severity (status, severity),
  INDEX idx_security_alerts_created (created_at),
  CONSTRAINT fk_security_alerts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  identifier VARCHAR(180) NOT NULL,
  status ENUM('successful', 'failed') NOT NULL,
  failure_reason VARCHAR(120),
  ip_address VARCHAR(80),
  browser VARCHAR(255),
  operating_system VARCHAR(160),
  device_info JSON,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts_identifier_time (identifier, attempted_at),
  INDEX idx_login_attempts_status_time (status, attempted_at),
  INDEX idx_login_attempts_user_time (user_id, attempted_at),
  CONSTRAINT fk_login_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS permission_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  permission VARCHAR(120) NOT NULL,
  resource VARCHAR(180),
  allowed TINYINT(1) NOT NULL DEFAULT 0,
  ip_address VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_permission_logs_user_created (user_id, created_at),
  INDEX idx_permission_logs_permission (permission),
  CONSTRAINT fk_permission_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS backup_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  backup_type ENUM('manual', 'scheduled', 'incremental', 'full') NOT NULL DEFAULT 'manual',
  backup_scope VARCHAR(120) NOT NULL DEFAULT 'full',
  backup_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('started', 'completed', 'failed') NOT NULL DEFAULT 'completed',
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  metadata JSON,
  file_path VARCHAR(600),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_backup_history_created (created_at),
  INDEX idx_backup_history_status (status),
  CONSTRAINT fk_backup_history_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS restore_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  backup_id BIGINT UNSIGNED NULL,
  restore_scope VARCHAR(120) NOT NULL,
  status ENUM('started', 'completed', 'failed') NOT NULL DEFAULT 'completed',
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  restored_by BIGINT UNSIGNED NULL,
  validation_status ENUM('pending', 'passed', 'failed') NOT NULL DEFAULT 'passed',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_restore_history_created (created_at),
  CONSTRAINT fk_restore_history_backup FOREIGN KEY (backup_id) REFERENCES backup_history(id) ON DELETE SET NULL,
  CONSTRAINT fk_restore_history_user FOREIGN KEY (restored_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS system_health (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  status ENUM('healthy', 'warning', 'critical') NOT NULL DEFAULT 'healthy',
  cpu_usage DECIMAL(8,2) DEFAULT 0,
  memory_usage DECIMAL(8,2) DEFAULT 0,
  storage_usage BIGINT UNSIGNED DEFAULT 0,
  database_size BIGINT UNSIGNED DEFAULT 0,
  api_requests INT UNSIGNED DEFAULT 0,
  active_users INT UNSIGNED DEFAULT 0,
  ai_requests INT UNSIGNED DEFAULT 0,
  error_count INT UNSIGNED DEFAULT 0,
  backup_status VARCHAR(80),
  metadata JSON,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_system_health_recorded (recorded_at),
  INDEX idx_system_health_status (status)
);

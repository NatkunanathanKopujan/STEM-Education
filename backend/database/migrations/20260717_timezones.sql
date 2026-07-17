CREATE TABLE IF NOT EXISTS timezones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  utc_offset VARCHAR(12) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_timezones_status (status),
  INDEX idx_timezones_default (is_default),
  CONSTRAINT fk_timezones_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_timezones_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO timezones (name, status, is_default, description)
SELECT JSON_UNQUOTE(setting_value), 'active', 1, 'Imported from system settings.'
FROM settings
WHERE setting_key = 'system.timezone'
  AND JSON_UNQUOTE(setting_value) IS NOT NULL
  AND JSON_UNQUOTE(setting_value) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM timezones WHERE name = JSON_UNQUOTE(settings.setting_value)
  );

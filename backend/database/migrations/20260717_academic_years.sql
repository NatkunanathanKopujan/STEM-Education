CREATE TABLE IF NOT EXISTS academic_years (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('upcoming', 'active', 'archived') NOT NULL DEFAULT 'upcoming',
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_academic_years_status (status),
  INDEX idx_academic_years_current (is_current),
  CONSTRAINT fk_academic_years_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_academic_years_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO academic_years (name, status, is_current, description)
SELECT JSON_UNQUOTE(setting_value), 'active', 1, 'Imported from system settings.'
FROM settings
WHERE setting_key = 'academic.year'
  AND JSON_UNQUOTE(setting_value) IS NOT NULL
  AND JSON_UNQUOTE(setting_value) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM academic_years WHERE name = JSON_UNQUOTE(settings.setting_value)
  );

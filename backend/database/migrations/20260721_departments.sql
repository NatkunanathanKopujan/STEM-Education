CREATE TABLE IF NOT EXISTS departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_departments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_departments_status_name (status, name)
);

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS department_id BIGINT UNSIGNED NULL AFTER department;

CREATE INDEX idx_teachers_department_id
  ON teachers (department_id);

INSERT IGNORE INTO departments (uuid, name, status)
SELECT UUID(), TRIM(department), 'active'
FROM teachers
WHERE department IS NOT NULL AND TRIM(department) <> '';

UPDATE teachers t
INNER JOIN departments d ON d.name = t.department
SET t.department_id = d.id
WHERE t.department_id IS NULL;

CREATE TABLE IF NOT EXISTS file_departments (
  file_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (file_id, department_id),
  CONSTRAINT fk_file_departments_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_departments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  INDEX idx_file_departments_department (department_id)
);

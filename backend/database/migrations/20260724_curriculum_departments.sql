ALTER TABLE curriculums
  ADD COLUMN IF NOT EXISTS department_id BIGINT UNSIGNED NULL AFTER academic_year;

SET @curriculum_department_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'curriculums'
    AND INDEX_NAME = 'idx_curriculums_department_id'
);

SET @curriculum_department_index_sql = IF(
  @curriculum_department_index_exists = 0,
  'CREATE INDEX idx_curriculums_department_id ON curriculums (department_id)',
  'SELECT 1'
);

PREPARE curriculum_department_index_stmt FROM @curriculum_department_index_sql;
EXECUTE curriculum_department_index_stmt;
DEALLOCATE PREPARE curriculum_department_index_stmt;

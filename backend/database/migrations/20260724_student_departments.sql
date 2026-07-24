ALTER TABLE students
  ADD COLUMN IF NOT EXISTS department_id BIGINT UNSIGNED NULL AFTER curriculum_id;

SET @student_department_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'students'
    AND INDEX_NAME = 'idx_students_department_id'
);

SET @student_department_index_sql = IF(
  @student_department_index_exists = 0,
  'CREATE INDEX idx_students_department_id ON students (department_id)',
  'SELECT 1'
);

PREPARE student_department_index_stmt FROM @student_department_index_sql;
EXECUTE student_department_index_stmt;
DEALLOCATE PREPARE student_department_index_stmt;

SET @teacher_owner_column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teachers'
    AND COLUMN_NAME = 'managed_by_admin_id'
);
SET @teacher_owner_column_sql := IF(
  @teacher_owner_column_exists = 0,
  'ALTER TABLE teachers ADD COLUMN managed_by_admin_id BIGINT UNSIGNED NULL AFTER user_id',
  'SELECT 1'
);
PREPARE teacher_owner_column_stmt FROM @teacher_owner_column_sql;
EXECUTE teacher_owner_column_stmt;
DEALLOCATE PREPARE teacher_owner_column_stmt;

SET @teacher_owner_index_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'teachers'
    AND INDEX_NAME = 'idx_teachers_managed_by_admin_id'
);
SET @teacher_owner_index_sql := IF(
  @teacher_owner_index_exists = 0,
  'CREATE INDEX idx_teachers_managed_by_admin_id ON teachers (managed_by_admin_id)',
  'SELECT 1'
);
PREPARE teacher_owner_index_stmt FROM @teacher_owner_index_sql;
EXECUTE teacher_owner_index_stmt;
DEALLOCATE PREPARE teacher_owner_index_stmt;

SET @student_owner_column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'students'
    AND COLUMN_NAME = 'managed_by_admin_id'
);
SET @student_owner_column_sql := IF(
  @student_owner_column_exists = 0,
  'ALTER TABLE students ADD COLUMN managed_by_admin_id BIGINT UNSIGNED NULL AFTER user_id',
  'SELECT 1'
);
PREPARE student_owner_column_stmt FROM @student_owner_column_sql;
EXECUTE student_owner_column_stmt;
DEALLOCATE PREPARE student_owner_column_stmt;

SET @student_owner_index_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'students'
    AND INDEX_NAME = 'idx_students_managed_by_admin_id'
);
SET @student_owner_index_sql := IF(
  @student_owner_index_exists = 0,
  'CREATE INDEX idx_students_managed_by_admin_id ON students (managed_by_admin_id)',
  'SELECT 1'
);
PREPARE student_owner_index_stmt FROM @student_owner_index_sql;
EXECUTE student_owner_index_stmt;
DEALLOCATE PREPARE student_owner_index_stmt;

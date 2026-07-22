ALTER TABLE curriculums
  ADD COLUMN IF NOT EXISTS duration VARCHAR(120) NULL AFTER description,
  ADD COLUMN IF NOT EXISTS academic_year VARCHAR(120) NULL AFTER duration;

CREATE TABLE IF NOT EXISTS curriculum_teachers (
  curriculum_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (curriculum_id, teacher_id),
  CONSTRAINT fk_curriculum_teachers_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE CASCADE,
  CONSTRAINT fk_curriculum_teachers_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

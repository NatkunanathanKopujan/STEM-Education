ALTER TABLE students
  ADD COLUMN curriculum_id BIGINT UNSIGNED NULL AFTER program;

CREATE INDEX idx_students_curriculum_id ON students (curriculum_id);

UPDATE students s
INNER JOIN curriculums c ON c.title = s.program
SET s.curriculum_id = c.id
WHERE s.curriculum_id IS NULL
  AND s.program IS NOT NULL
  AND s.program <> '';

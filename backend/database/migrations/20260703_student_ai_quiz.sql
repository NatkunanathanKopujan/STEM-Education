ALTER TABLE quiz_attempts
  DROP FOREIGN KEY fk_quiz_attempts_course;

ALTER TABLE quiz_attempts
  MODIFY course_id BIGINT UNSIGNED NULL;

ALTER TABLE quiz_attempts
  ADD CONSTRAINT fk_quiz_attempts_course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;

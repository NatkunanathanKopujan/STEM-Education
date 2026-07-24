CREATE TABLE IF NOT EXISTS teacher_departments (
  teacher_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_id, department_id),
  CONSTRAINT fk_teacher_departments_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  CONSTRAINT fk_teacher_departments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  INDEX idx_teacher_departments_department (department_id)
);

CREATE TABLE IF NOT EXISTS student_departments (
  student_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (student_id, department_id),
  CONSTRAINT fk_student_departments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_departments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  INDEX idx_student_departments_department (department_id)
);

INSERT IGNORE INTO teacher_departments (teacher_id, department_id)
SELECT id, department_id
FROM teachers
WHERE department_id IS NOT NULL;

INSERT IGNORE INTO student_departments (student_id, department_id)
SELECT id, department_id
FROM students
WHERE department_id IS NOT NULL;

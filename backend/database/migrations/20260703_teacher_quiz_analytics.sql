CREATE TABLE IF NOT EXISTS question_exposure (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  quiz_number INT UNSIGNED NOT NULL,
  exposure_count INT UNSIGNED NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_exposure_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_exposure_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
  UNIQUE KEY uq_question_exposure_student_question (student_id, question_id),
  INDEX idx_question_exposure_question (question_id),
  INDEX idx_question_exposure_student (student_id)
);

CREATE TABLE IF NOT EXISTS teacher_analytics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NULL,
  metric_key VARCHAR(120) NOT NULL,
  metric_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  metadata JSON NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_teacher_analytics_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_teacher_analytics_teacher_metric (teacher_id, metric_key)
);

CREATE TABLE IF NOT EXISTS topic_statistics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NULL,
  week_no INT UNSIGNED NULL,
  topic VARCHAR(180) NOT NULL,
  total_questions INT UNSIGNED NOT NULL DEFAULT 0,
  average_score DECIMAL(6, 2) NOT NULL DEFAULT 0,
  correct_percentage DECIMAL(6, 2) NOT NULL DEFAULT 0,
  incorrect_percentage DECIMAL(6, 2) NOT NULL DEFAULT 0,
  weak_student_count INT UNSIGNED NOT NULL DEFAULT 0,
  strong_student_count INT UNSIGNED NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_topic_statistics_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_topic_statistics_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  INDEX idx_topic_statistics_scope (teacher_id, curriculum_id, subject, week_no, topic)
);

CREATE TABLE IF NOT EXISTS student_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  average_percentage DECIMAL(6, 2) NOT NULL DEFAULT 0,
  highest_score DECIMAL(8, 2) NOT NULL DEFAULT 0,
  lowest_score DECIMAL(8, 2) NOT NULL DEFAULT 0,
  total_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  progress_status ENUM('excellent', 'good', 'needs_review', 'at_risk') NOT NULL DEFAULT 'good',
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_progress_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_progress_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  UNIQUE KEY uq_student_progress_scope (student_id, curriculum_id)
);

CREATE TABLE IF NOT EXISTS weekly_statistics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  week_no INT UNSIGNED NOT NULL,
  completed_topics INT UNSIGNED NOT NULL DEFAULT 0,
  average_percentage DECIMAL(6, 2) NOT NULL DEFAULT 0,
  student_participation INT UNSIGNED NOT NULL DEFAULT 0,
  quiz_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_weekly_statistics_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_weekly_statistics_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  INDEX idx_weekly_statistics_scope (teacher_id, curriculum_id, week_no)
);

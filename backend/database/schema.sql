CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(60) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  status ENUM('active', 'inactive', 'locked') NOT NULL DEFAULT 'active',
  profile_photo VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_username (username),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status),
  INDEX idx_users_active (is_active)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP NULL,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(255) NULL,
  device_info JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  address VARCHAR(255) NULL,
  bio TEXT NULL,
  department VARCHAR(120) NULL,
  qualification VARCHAR(180) NULL,
  curriculum VARCHAR(180) NULL,
  employee_id VARCHAR(80) NULL,
  student_id VARCHAR(80) NULL,
  phone_visibility TINYINT(1) NOT NULL DEFAULT 1,
  email_visibility TINYINT(1) NOT NULL DEFAULT 1,
  profile_visibility ENUM('private', 'role_members', 'public') NOT NULL DEFAULT 'role_members',
  password_changed_at TIMESTAMP NULL,
  last_failed_login TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  theme_preference ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'light',
  language_preference ENUM('en', 'ta', 'si') NOT NULL DEFAULT 'en',
  timezone VARCHAR(80) NULL,
  preferences JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  login_at TIMESTAMP NULL,
  logout_at TIMESTAMP NULL,
  ip_address VARCHAR(80) NULL,
  browser VARCHAR(160) NULL,
  operating_system VARCHAR(160) NULL,
  location VARCHAR(160) NULL,
  status ENUM('successful', 'failed') NOT NULL DEFAULT 'successful',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_login_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_login_history_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  session_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(255) NULL,
  device_info JSON NULL,
  login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  CONSTRAINT fk_active_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_active_sessions_session FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
  INDEX idx_active_sessions_user (user_id, revoked_at)
);

CREATE TABLE IF NOT EXISTS security_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  ip_address VARCHAR(80) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_security_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_security_events_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS profile_photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(180) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  file_size INT UNSIGNED NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_photos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profile_photos_user_active (user_id, is_active)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_reset_tokens_expiry (expires_at)
);

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  employee_no VARCHAR(60) NULL UNIQUE,
  department VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  employee_no VARCHAR(60) NULL UNIQUE,
  specialization VARCHAR(160) NULL,
  department VARCHAR(120) NULL,
  department_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_teachers_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  student_no VARCHAR(60) NULL UNIQUE,
  enrollment_year YEAR NULL,
  program VARCHAR(160) NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_students_curriculum_id (curriculum_id)
);

CREATE TABLE IF NOT EXISTS curriculums (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  code VARCHAR(60) NOT NULL UNIQUE,
  description TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_curriculums_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  curriculum_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  code VARCHAR(60) NOT NULL UNIQUE,
  description TEXT NULL,
  credit_hours DECIMAL(4, 1) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_courses_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE CASCADE,
  CONSTRAINT fk_courses_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS materials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  course_id BIGINT UNSIGNED NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  material_type ENUM('pdf', 'ppt', 'doc', 'docx', 'video', 'image', 'note', 'other') NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_materials_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_materials_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_materials_course (course_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  attachment_path VARCHAR(255) NULL,
  audience_role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  priority ENUM('normal', 'important', 'urgent') NOT NULL DEFAULT 'normal',
  status ENUM('draft', 'published', 'expired') NOT NULL DEFAULT 'draft',
  expiry_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NULL,
  publish_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS announcement_targets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('all_users', 'role', 'curriculum', 'batch', 'teacher', 'student') NOT NULL DEFAULT 'all_users',
  target_role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  target_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcement_targets_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  INDEX idx_announcement_targets_scope (target_type, target_role, target_id)
);

CREATE TABLE IF NOT EXISTS announcement_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  announcement_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(180) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcement_attachments_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('system', 'academic', 'quiz', 'material', 'announcement', 'security', 'reminder') NOT NULL DEFAULT 'system',
  priority ENUM('normal', 'important', 'urgent') NOT NULL DEFAULT 'normal',
  source_module VARCHAR(120) NULL,
  action_url VARCHAR(255) NULL,
  status ENUM('active', 'archived', 'deleted') NOT NULL DEFAULT 'active',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at TIMESTAMP NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, is_read, created_at),
  INDEX idx_notifications_role_type (role, notification_type)
);

CREATE TABLE IF NOT EXISTS notification_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  notification_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('created', 'read', 'deleted', 'archived') NOT NULL,
  event_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON NULL,
  CONSTRAINT fk_notification_history_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notification_history_user (user_id, event_at)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  quiz_notifications TINYINT(1) NOT NULL DEFAULT 1,
  announcement_notifications TINYINT(1) NOT NULL DEFAULT 1,
  material_upload_notifications TINYINT(1) NOT NULL DEFAULT 1,
  reminder_notifications TINYINT(1) NOT NULL DEFAULT 1,
  security_notifications TINYINT(1) NOT NULL DEFAULT 1,
  email_notifications TINYINT(1) NOT NULL DEFAULT 0,
  push_notifications TINYINT(1) NOT NULL DEFAULT 0,
  sms_notifications TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weekly_teaching_plan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  course_id BIGINT UNSIGNED NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  week_no INT UNSIGNED NOT NULL,
  topic VARCHAR(180) NOT NULL,
  objectives TEXT NULL,
  activities TEXT NULL,
  resources TEXT NULL,
  planned_date DATE NULL,
  status ENUM('draft', 'published', 'completed', 'upcoming') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_weekly_plan_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_weekly_plan_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  UNIQUE KEY uq_weekly_plan_course_week (course_id, week_no)
);

CREATE TABLE IF NOT EXISTS question_bank (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  curriculum_id BIGINT UNSIGNED NULL,
  course_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NULL,
  week_no INT UNSIGNED NULL,
  topic VARCHAR(180) NULL,
  created_by BIGINT UNSIGNED NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  category ENUM('concept', 'definition', 'scenario', 'practical', 'true_false_mcq', 'application') NOT NULL DEFAULT 'concept',
  question_text TEXT NOT NULL,
  option_a TEXT NULL,
  option_b TEXT NULL,
  option_c TEXT NULL,
  option_d TEXT NULL,
  correct_answer ENUM('A', 'B', 'C', 'D') NULL,
  explanation TEXT NULL,
  similarity_score DECIMAL(5, 4) NULL,
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_by_ai TINYINT(1) NOT NULL DEFAULT 1,
  approved_by BIGINT UNSIGNED NULL,
  ai_version VARCHAR(60) NULL,
  status ENUM('draft', 'approved', 'archived') NOT NULL DEFAULT 'draft',
  generated_at TIMESTAMP NULL,
  marks DECIMAL(8, 2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_bank_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_bank_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_bank_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_bank_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_question_bank_topic (curriculum_id, subject, week_no, topic),
  INDEX idx_question_bank_difficulty (difficulty),
  INDEX idx_question_bank_approval (approval_status)
);

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  material_id BIGINT UNSIGNED NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  course_id BIGINT UNSIGNED NULL,
  teacher_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NOT NULL,
  week_no INT UNSIGNED NOT NULL,
  topic VARCHAR(180) NOT NULL,
  extracted_text LONGTEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  source_type ENUM('pdf', 'ppt', 'pptx', 'doc', 'docx', 'teacher_note', 'lesson_description', 'video_description', 'weekly_plan') NOT NULL,
  ai_version VARCHAR(60) NOT NULL DEFAULT 'foundation-v1',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('active', 'superseded', 'archived') NOT NULL DEFAULT 'active',
  uploaded_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_kb_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_kb_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_kb_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_kb_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_ai_kb_content_hash (content_hash),
  INDEX idx_ai_kb_topic (curriculum_id, subject, week_no, topic),
  INDEX idx_ai_kb_status (status)
);

CREATE TABLE IF NOT EXISTS question_generation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  event_type ENUM('material_uploaded', 'extraction_started', 'extraction_completed', 'questions_generated', 'knowledge_base_updated', 'processing_error') NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  course_id BIGINT UNSIGNED NULL,
  material_id BIGINT UNSIGNED NULL,
  topic VARCHAR(180) NULL,
  message VARCHAR(255) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_logs_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_logs_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_logs_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_logs_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
  INDEX idx_question_logs_event (event_type),
  INDEX idx_question_logs_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  provider VARCHAR(60) NOT NULL,
  model VARCHAR(120) NOT NULL,
  teacher_id BIGINT UNSIGNED NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  course_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NULL,
  topic VARCHAR(180) NULL,
  week_no INT UNSIGNED NULL,
  prompt_id VARCHAR(120) NULL,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  duration_ms INT UNSIGNED NULL,
  prompt_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  completion_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  total_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(12, 6) NOT NULL DEFAULT 0,
  questions_generated INT UNSIGNED NOT NULL DEFAULT 0,
  questions_rejected INT UNSIGNED NOT NULL DEFAULT 0,
  questions_saved INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('success', 'failed') NOT NULL DEFAULT 'success',
  error_message VARCHAR(255) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_usage_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_usage_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  CONSTRAINT fk_ai_usage_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  INDEX idx_ai_usage_provider_created (provider, created_at),
  INDEX idx_ai_usage_teacher_created (teacher_id, created_at)
);

CREATE TABLE IF NOT EXISTS question_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL,
  question_snapshot JSON NOT NULL,
  ai_version VARCHAR(60) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_versions_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_versions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_question_versions (question_id, version)
);

CREATE TABLE IF NOT EXISTS question_topics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  curriculum_id BIGINT UNSIGNED NULL,
  course_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NOT NULL,
  week_no INT UNSIGNED NOT NULL,
  topic VARCHAR(180) NOT NULL,
  status ENUM('completed', 'upcoming') NOT NULL DEFAULT 'upcoming',
  completed_at TIMESTAMP NULL,
  teacher_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_topics_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_topics_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_question_topics_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_question_topic_scope (curriculum_id, course_id, subject, week_no, topic),
  INDEX idx_question_topics_status (status)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  student_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  subject VARCHAR(180) NULL,
  quiz_number INT UNSIGNED NOT NULL,
  week_coverage JSON NULL,
  started_at TIMESTAMP NULL,
  submitted_at TIMESTAMP NULL,
  score DECIMAL(8, 2) NULL,
  percentage DECIMAL(6, 2) NULL,
  duration_seconds INT UNSIGNED NULL,
  pass_status ENUM('pass', 'fail') NULL,
  reuse_notice TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('started', 'submitted', 'graded') NOT NULL DEFAULT 'started',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_attempts_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_attempts_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  CONSTRAINT fk_quiz_attempts_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  UNIQUE KEY uq_quiz_attempt_student_number (student_id, quiz_number),
  INDEX idx_quiz_attempt_student_status (student_id, status)
);

CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  quiz_number INT UNSIGNED NOT NULL,
  question_order INT UNSIGNED NOT NULL,
  randomized_options JSON NOT NULL,
  selected_answer ENUM('A', 'B', 'C', 'D') NULL,
  is_correct TINYINT(1) NULL,
  answered_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_answers_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_answers_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
  UNIQUE KEY uq_quiz_answer_attempt_question (attempt_id, question_id),
  INDEX idx_quiz_answers_attempt_order (attempt_id, question_order)
);

CREATE TABLE IF NOT EXISTS student_question_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NULL,
  quiz_number INT UNSIGNED NULL,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  topic VARCHAR(180) NULL,
  curriculum_id BIGINT UNSIGNED NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  student_answer TEXT NULL,
  is_correct TINYINT(1) NULL,
  marks_awarded DECIMAL(8, 2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_question_history_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_history_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_history_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_history_curriculum FOREIGN KEY (curriculum_id) REFERENCES curriculums(id) ON DELETE SET NULL,
  UNIQUE KEY uq_attempt_question (attempt_id, question_id)
);

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

CREATE TABLE IF NOT EXISTS quiz_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL UNIQUE,
  student_id BIGINT UNSIGNED NOT NULL,
  quiz_number INT UNSIGNED NOT NULL,
  correct_answers INT UNSIGNED NOT NULL DEFAULT 0,
  wrong_answers INT UNSIGNED NOT NULL DEFAULT 0,
  score DECIMAL(8, 2) NOT NULL DEFAULT 0,
  percentage DECIMAL(6, 2) NOT NULL DEFAULT 0,
  duration_seconds INT UNSIGNED NULL,
  pass_status ENUM('pass', 'fail') NOT NULL,
  completed_topics JSON NULL,
  review_enabled TINYINT(1) NOT NULL DEFAULT 1,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_results_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_quiz_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_quiz_result_student_number (student_id, quiz_number)
);

CREATE TABLE IF NOT EXISTS student_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(255) NOT NULL,
  metadata JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_notifications_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_notifications_student (student_id, is_read)
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

CREATE TABLE IF NOT EXISTS marks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  student_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,
  assessment_type VARCHAR(80) NOT NULL,
  marks_obtained DECIMAL(8, 2) NOT NULL,
  max_marks DECIMAL(8, 2) NOT NULL,
  graded_by BIGINT UNSIGNED NULL,
  graded_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_marks_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_marks_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_marks_graded_by FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  report_type VARCHAR(80) NOT NULL,
  filters JSON NULL,
  generated_by BIGINT UNSIGNED NULL,
  file_path VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_generated_by FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  report_type VARCHAR(120) NOT NULL,
  role_scope ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  generated_by BIGINT UNSIGNED NULL,
  filters JSON NULL,
  payload JSON NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_generated_reports_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_generated_reports_type_role (report_type, role_scope),
  INDEX idx_generated_reports_generated_at (generated_at)
);

CREATE TABLE IF NOT EXISTS report_export_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  report_type VARCHAR(120) NOT NULL,
  export_format ENUM('pdf', 'excel', 'csv') NOT NULL,
  export_scope ENUM('current_page', 'filtered_data', 'complete_report', 'selected_students', 'selected_teachers', 'date_range') NOT NULL DEFAULT 'filtered_data',
  requested_by BIGINT UNSIGNED NULL,
  status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
  file_name VARCHAR(255) NULL,
  filters JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_export_user FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_report_export_user_created (requested_by, created_at)
);

CREATE TABLE IF NOT EXISTS analytics_cache (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(180) NOT NULL UNIQUE,
  role_scope ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  payload JSON NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_analytics_cache_expiry (expires_at)
);

CREATE TABLE IF NOT EXISTS user_report_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  report_type VARCHAR(120) NOT NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  filters JSON NULL,
  CONSTRAINT fk_user_report_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_report_history_user (user_id, viewed_at)
);

CREATE TABLE IF NOT EXISTS report_preferences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  report_type VARCHAR(120) NOT NULL,
  preferences JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_report_preferences_user_type (user_id, report_type)
);

CREATE TABLE IF NOT EXISTS search_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  search_term VARCHAR(255) NOT NULL,
  search_category VARCHAR(80) NULL,
  filters JSON NULL,
  result_count INT UNSIGNED NOT NULL DEFAULT 0,
  device_info JSON NULL,
  searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_search_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_search_history_user_time (user_id, searched_at),
  INDEX idx_search_history_term (search_term)
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  search_term VARCHAR(255) NOT NULL,
  filters JSON NULL,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_searches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_saved_searches_user_pinned (user_id, is_pinned)
);

CREATE TABLE IF NOT EXISTS search_analytics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  search_term VARCHAR(255) NOT NULL,
  search_category VARCHAR(80) NULL,
  user_id BIGINT UNSIGNED NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  result_count INT UNSIGNED NOT NULL DEFAULT 0,
  success TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_search_analytics_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_search_analytics_term (search_term),
  INDEX idx_search_analytics_created (created_at)
);

CREATE TABLE IF NOT EXISTS popular_searches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  search_term VARCHAR(255) NOT NULL UNIQUE,
  search_count INT UNSIGNED NOT NULL DEFAULT 1,
  last_searched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_popular_searches_count (search_count)
);

CREATE TABLE IF NOT EXISTS files (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  mime_type VARCHAR(150),
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  file_path VARCHAR(600) NOT NULL,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  uploaded_by BIGINT UNSIGNED NOT NULL,
  uploaded_role ENUM('super-admin', 'admin', 'teacher', 'student') NOT NULL,
  curriculum VARCHAR(150),
  subject VARCHAR(150),
  week_no INT UNSIGNED,
  topic VARCHAR(255),
  logical_folder VARCHAR(700),
  version INT UNSIGNED NOT NULL DEFAULT 1,
  current_version_id BIGINT UNSIGNED NULL,
  description TEXT,
  visibility ENUM('public', 'private', 'restricted', 'draft') NOT NULL DEFAULT 'private',
  status ENUM('active', 'archived', 'draft', 'deleted') NOT NULL DEFAULT 'active',
  tags VARCHAR(500),
  checksum VARCHAR(128),
  download_count INT UNSIGNED NOT NULL DEFAULT 0,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_files_uploaded_by (uploaded_by),
  INDEX idx_files_type_status (file_type, status),
  INDEX idx_files_visibility_status (visibility, status),
  INDEX idx_files_curriculum_subject (curriculum, subject),
  INDEX idx_files_week_topic (week_no, topic),
  INDEX idx_files_created_at (created_at),
  CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id BIGINT UNSIGNED NOT NULL,
  version INT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  mime_type VARCHAR(150),
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  file_path VARCHAR(600) NOT NULL,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'local',
  uploaded_by BIGINT UNSIGNED NOT NULL,
  description TEXT,
  version_note TEXT,
  checksum VARCHAR(128),
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_file_version (file_id, version),
  INDEX idx_file_versions_file_id (file_id),
  INDEX idx_file_versions_uploaded_by (uploaded_by),
  CONSTRAINT fk_file_versions_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_versions_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_downloads (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id BIGINT UNSIGNED NOT NULL,
  downloaded_by BIGINT UNSIGNED NOT NULL,
  download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64),
  device_information JSON,
  INDEX idx_file_downloads_file_id (file_id),
  INDEX idx_file_downloads_user_id (downloaded_by),
  INDEX idx_file_downloads_date (download_date),
  CONSTRAINT fk_file_downloads_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_downloads_user FOREIGN KEY (downloaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_previews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id BIGINT UNSIGNED NOT NULL,
  viewed_by BIGINT UNSIGNED NOT NULL,
  preview_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64),
  device_information JSON,
  INDEX idx_file_previews_file_id (file_id),
  INDEX idx_file_previews_user_id (viewed_by),
  INDEX idx_file_previews_date (preview_date),
  CONSTRAINT fk_file_previews_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  CONSTRAINT fk_file_previews_user FOREIGN KEY (viewed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS storage_statistics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  total_files INT UNSIGNED NOT NULL DEFAULT 0,
  total_storage_used BIGINT UNSIGNED NOT NULL DEFAULT 0,
  storage_by_file_type JSON,
  provider VARCHAR(50) NOT NULL DEFAULT 'local',
  role_scope VARCHAR(50) NULL,
  generated_by BIGINT UNSIGNED NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_storage_statistics_recorded_at (recorded_at)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  action VARCHAR(120) NOT NULL,
  module VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL,
  ip_address VARCHAR(80),
  browser VARCHAR(255),
  device VARCHAR(255),
  status ENUM('success', 'failed', 'warning') NOT NULL DEFAULT 'success',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_user_created (user_id, created_at),
  INDEX idx_audit_logs_module_action (module, action),
  INDEX idx_audit_logs_status_created (status, created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS security_alerts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  alert_type VARCHAR(120) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  title VARCHAR(180) NOT NULL,
  description VARCHAR(700) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  source_module VARCHAR(120),
  ip_address VARCHAR(80),
  status ENUM('open', 'acknowledged', 'resolved') NOT NULL DEFAULT 'open',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_security_alerts_status_severity (status, severity),
  INDEX idx_security_alerts_created (created_at),
  CONSTRAINT fk_security_alerts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  identifier VARCHAR(180) NOT NULL,
  status ENUM('successful', 'failed') NOT NULL,
  failure_reason VARCHAR(120),
  ip_address VARCHAR(80),
  browser VARCHAR(255),
  operating_system VARCHAR(160),
  device_info JSON,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts_identifier_time (identifier, attempted_at),
  INDEX idx_login_attempts_status_time (status, attempted_at),
  INDEX idx_login_attempts_user_time (user_id, attempted_at),
  CONSTRAINT fk_login_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS permission_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  role ENUM('super-admin', 'admin', 'teacher', 'student') NULL,
  permission VARCHAR(120) NOT NULL,
  resource VARCHAR(180),
  allowed TINYINT(1) NOT NULL DEFAULT 0,
  ip_address VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_permission_logs_user_created (user_id, created_at),
  INDEX idx_permission_logs_permission (permission),
  CONSTRAINT fk_permission_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS backup_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  backup_type ENUM('manual', 'scheduled', 'incremental', 'full') NOT NULL DEFAULT 'manual',
  backup_scope VARCHAR(120) NOT NULL DEFAULT 'full',
  backup_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('started', 'completed', 'failed') NOT NULL DEFAULT 'completed',
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  metadata JSON,
  file_path VARCHAR(600),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_backup_history_created (created_at),
  INDEX idx_backup_history_status (status),
  CONSTRAINT fk_backup_history_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS restore_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64) NOT NULL UNIQUE,
  backup_id BIGINT UNSIGNED NULL,
  restore_scope VARCHAR(120) NOT NULL,
  status ENUM('started', 'completed', 'failed') NOT NULL DEFAULT 'completed',
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  restored_by BIGINT UNSIGNED NULL,
  validation_status ENUM('pending', 'passed', 'failed') NOT NULL DEFAULT 'passed',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_restore_history_created (created_at),
  CONSTRAINT fk_restore_history_backup FOREIGN KEY (backup_id) REFERENCES backup_history(id) ON DELETE SET NULL,
  CONSTRAINT fk_restore_history_user FOREIGN KEY (restored_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS system_health (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  status ENUM('healthy', 'warning', 'critical') NOT NULL DEFAULT 'healthy',
  cpu_usage DECIMAL(8,2) DEFAULT 0,
  memory_usage DECIMAL(8,2) DEFAULT 0,
  storage_usage BIGINT UNSIGNED DEFAULT 0,
  database_size BIGINT UNSIGNED DEFAULT 0,
  api_requests INT UNSIGNED DEFAULT 0,
  active_users INT UNSIGNED DEFAULT 0,
  ai_requests INT UNSIGNED DEFAULT 0,
  error_count INT UNSIGNED DEFAULT 0,
  backup_status VARCHAR(80),
  metadata JSON,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_system_health_recorded (recorded_at),
  INDEX idx_system_health_status (status)
);

CREATE TABLE IF NOT EXISTS settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value JSON NULL,
  description VARCHAR(255) NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS academic_years (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('upcoming', 'active', 'archived') NOT NULL DEFAULT 'upcoming',
  is_current TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_academic_years_status (status),
  INDEX idx_academic_years_current (is_current),
  CONSTRAINT fk_academic_years_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_academic_years_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO academic_years (name, status, is_current, description)
SELECT JSON_UNQUOTE(setting_value), 'active', 1, 'Imported from system settings.'
FROM settings
WHERE setting_key = 'academic.year'
  AND JSON_UNQUOTE(setting_value) IS NOT NULL
  AND JSON_UNQUOTE(setting_value) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM academic_years WHERE name = JSON_UNQUOTE(settings.setting_value)
  );

CREATE TABLE IF NOT EXISTS timezones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  utc_offset VARCHAR(12) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_timezones_status (status),
  INDEX idx_timezones_default (is_default),
  CONSTRAINT fk_timezones_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_timezones_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO timezones (name, status, is_default, description)
SELECT JSON_UNQUOTE(setting_value), 'active', 1, 'Imported from system settings.'
FROM settings
WHERE setting_key = 'system.timezone'
  AND JSON_UNQUOTE(setting_value) IS NOT NULL
  AND JSON_UNQUOTE(setting_value) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM timezones WHERE name = JSON_UNQUOTE(settings.setting_value)
  );

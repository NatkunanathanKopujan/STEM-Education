ALTER TABLE user_sessions
  ADD INDEX idx_user_sessions_active (user_id, logout_time, login_time);

ALTER TABLE login_attempts
  ADD INDEX idx_login_attempts_ip_status_time (ip_address, status, attempted_at);

ALTER TABLE notifications
  ADD INDEX idx_notifications_user_status_read (user_id, status, is_read, created_at);

ALTER TABLE announcements
  ADD INDEX idx_announcements_status_publish (status, publish_at, created_at);

ALTER TABLE materials
  ADD INDEX idx_materials_scope_status (curriculum_id, week_no, material_type, status, created_at);

ALTER TABLE files
  ADD INDEX idx_files_search_scope (curriculum, subject, week_no, file_type, visibility, status),
  ADD INDEX idx_files_usage (download_count, view_count, created_at);

ALTER TABLE question_bank
  ADD INDEX idx_question_bank_quiz_selection (curriculum_id, subject, week_no, topic, difficulty, approval_status, status);

ALTER TABLE ai_knowledge_base
  ADD INDEX idx_ai_kb_completed_scope (curriculum_id, subject, week_no, topic, status);

ALTER TABLE quiz_attempts
  ADD INDEX idx_quiz_attempts_student_status_date (student_id, status, attempt_date);

ALTER TABLE reports
  ADD INDEX idx_reports_type_status_date (report_type, status, created_at);

ALTER TABLE search_history
  ADD INDEX idx_search_history_category_time (search_category, searched_at);

ALTER TABLE audit_logs
  ADD INDEX idx_audit_logs_role_module_time (role, module, created_at);

ALTER TABLE security_alerts
  ADD INDEX idx_security_alerts_type_time (alert_type, created_at);

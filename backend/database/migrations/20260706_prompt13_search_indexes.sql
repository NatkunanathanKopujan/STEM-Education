ALTER TABLE search_analytics
  ADD COLUMN clicked_result_id VARCHAR(80) NULL,
  ADD COLUMN clicked_category VARCHAR(80) NULL;

CREATE INDEX idx_search_history_category_time
  ON search_history (search_category, searched_at);

CREATE INDEX idx_search_analytics_category_success
  ON search_analytics (search_category, success, created_at);

CREATE INDEX idx_materials_type_published
  ON materials (material_type, is_published, created_at);

CREATE INDEX idx_question_topics_teacher_status
  ON question_topics (teacher_id, status, week_no);

CREATE INDEX idx_quiz_attempts_number_date
  ON quiz_attempts (quiz_number, created_at);

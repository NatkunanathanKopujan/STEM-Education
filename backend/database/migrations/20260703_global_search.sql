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

CREATE TABLE IF NOT EXISTS stations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS controllers (
  id VARCHAR(64) PRIMARY KEY,
  station_id VARCHAR(64),
  fw VARCHAR(64),
  hw VARCHAR(64),
  last_status ENUM('online','offline','unknown') DEFAULT 'unknown',
  last_seen_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locks (
  id VARCHAR(64) PRIMARY KEY,
  controller_id VARCHAR(64),
  position VARCHAR(32),
  last_state ENUM('locked','unlocked') NULL,
  last_seq BIGINT NULL,
  last_battery TINYINT NULL,
  last_rssi INT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  station_id VARCHAR(64),
  controller_id VARCHAR(64),
  lock_id VARCHAR(64),
  ts BIGINT,
  state ENUM('locked','unlocked'),
  battery TINYINT,
  rssi INT,
  fw VARCHAR(64),
  seq BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_telemetry (station_id, controller_id, lock_id, ts)
);

CREATE TABLE IF NOT EXISTS events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  station_id VARCHAR(64),
  controller_id VARCHAR(64),
  lock_id VARCHAR(64),
  ts BIGINT,
  event VARCHAR(64),
  details_json JSON,
  severity ENUM('info','warn','error') DEFAULT 'info',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commands (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  req_id VARCHAR(32) UNIQUE,
  station_id VARCHAR(64),
  controller_id VARCHAR(64),
  lock_id VARCHAR(64),
  cmd VARCHAR(32),
  ts_requested BIGINT,
  timeout_ms INT,
  status ENUM('pending','success','error','timeout') DEFAULT 'pending',
  ts_resolved BIGINT NULL,
  error_msg VARCHAR(256) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
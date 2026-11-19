CREATE TABLE IF NOT EXISTS build_queue (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  request_hash TEXT NOT NULL,
  task_prompt TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('module','probe')),
  status TEXT NOT NULL CHECK (status IN ('pending','running','generated','published','failed')),
  publish INTEGER NOT NULL CHECK (publish IN (0,1)),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_at INTEGER NOT NULL,
  lease_owner TEXT,
  lease_until INTEGER,
  code_output TEXT,
  code_sha256 TEXT,
  provider TEXT,
  publish_status TEXT,
  commit_url TEXT,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  finished_at INTEGER
);

CREATE INDEX IF NOT EXISTS build_dispatch ON build_queue(status,next_at,created_at);

CREATE TABLE IF NOT EXISTS build_clock (
  singleton INTEGER PRIMARY KEY CHECK (singleton=1),
  last_cron_at INTEGER,
  last_alarm_at INTEGER
);

INSERT OR IGNORE INTO build_clock(singleton) VALUES(1);

CREATE TABLE IF NOT EXISTS oauth_codes (
  digest TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  challenge TEXT NOT NULL,
  expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  digest TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  expires INTEGER NOT NULL
);

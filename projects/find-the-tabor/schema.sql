CREATE TABLE IF NOT EXISTS source_checks (
  source_id TEXT PRIMARY KEY,
  checked_at TEXT NOT NULL,
  http_status INTEGER,
  outcome TEXT NOT NULL
);

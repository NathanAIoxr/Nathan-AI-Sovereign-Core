CREATE TABLE IF NOT EXISTS cockpit_source_checks (
  source_db TEXT NOT NULL,
  source_table TEXT NOT NULL,
  live_rows INTEGER,
  checked_at TEXT,
  last_attempt TEXT,
  error TEXT,
  PRIMARY KEY(source_db, source_table)
);

CREATE TABLE IF NOT EXISTS cockpit_runtime (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL CHECK(json_valid(value)),
  checked_at TEXT NOT NULL
);

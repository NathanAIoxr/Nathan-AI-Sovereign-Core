CREATE TABLE IF NOT EXISTS reader_findings (
  event_id TEXT PRIMARY KEY NOT NULL,
  target TEXT NOT NULL,
  revision TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('candidate','review')),
  source_tables TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  processed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_processed ON messages(processed_at DESC);

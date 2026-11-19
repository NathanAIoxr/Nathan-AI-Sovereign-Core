CREATE TABLE IF NOT EXISTS taborpool_ledger (
  id TEXT PRIMARY KEY,
  register TEXT NOT NULL CHECK (register IN ('BROADSHEET','TREASURY','POOL_DISTRIBUTION')),
  source TEXT NOT NULL,
  units INTEGER NOT NULL CHECK (units BETWEEN -1000000 AND 1000000),
  payload_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (register <> 'BROADSHEET' OR units = 0)
);
CREATE INDEX IF NOT EXISTS taborpool_ledger_recency ON taborpool_ledger(created_at DESC,id);
CREATE TABLE IF NOT EXISTS build_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  verified_at INTEGER NOT NULL
);

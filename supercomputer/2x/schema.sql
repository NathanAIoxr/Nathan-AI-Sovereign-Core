CREATE TABLE IF NOT EXISTS sovereign_2x_receipts (
  fixture TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  receipt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sovereign_operations_runs (
  scheduled_ms INTEGER PRIMARY KEY,
  completed_at TEXT NOT NULL,
  passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
  checks TEXT NOT NULL
);

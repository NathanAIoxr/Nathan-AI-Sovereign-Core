CREATE TABLE IF NOT EXISTS conductor_intake_receipts (
  receipt_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('ci-failure', 'build-proposal')),
  reference TEXT NOT NULL,
  revision TEXT,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) WITHOUT ROWID;

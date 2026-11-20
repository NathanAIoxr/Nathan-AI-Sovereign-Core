CREATE TABLE IF NOT EXISTS crypto_mirror_receipts (
  state_sha256 TEXT PRIMARY KEY NOT NULL
    CHECK (length(state_sha256) = 64 AND state_sha256 NOT GLOB '*[^a-f0-9]*'),
  state_bytes BLOB NOT NULL CHECK (typeof(state_bytes) = 'blob'),
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

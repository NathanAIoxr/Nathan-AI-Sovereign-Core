CREATE TABLE IF NOT EXISTS manifest_node_receipts (
  source_sha256 TEXT PRIMARY KEY CHECK (length(source_sha256) = 64),
  build_units INTEGER NOT NULL DEFAULT 1 CHECK (build_units IN (1, 2)),
  clear_units INTEGER NOT NULL DEFAULT 1 CHECK (clear_units IN (0, 1)),
  verified_at TEXT,
  CHECK (verified_at IS NULL OR (build_units = 2 AND clear_units = 0))
) STRICT;

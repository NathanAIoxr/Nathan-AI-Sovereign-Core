CREATE TABLE IF NOT EXISTS provenance_ledger (
  project_id TEXT NOT NULL REFERENCES zones_registry(project_id),
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  content_sha256 TEXT NOT NULL CHECK (length(content_sha256) = 64 AND content_sha256 NOT GLOB '*[^0-9a-f]*'),
  previous_hash TEXT NOT NULL CHECK (length(previous_hash) = 64 AND previous_hash NOT GLOB '*[^0-9a-f]*'),
  entry_hash TEXT NOT NULL CHECK (length(entry_hash) = 64 AND entry_hash NOT GLOB '*[^0-9a-f]*'),
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 1048576),
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (project_id, sequence),
  UNIQUE (project_id, content_sha256)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS telemetry_stream (
  project_id TEXT NOT NULL REFERENCES zones_registry(project_id),
  event_id TEXT NOT NULL CHECK (length(event_id) BETWEEN 1 AND 96),
  source TEXT NOT NULL CHECK (source IN ('http','voice')),
  body TEXT NOT NULL CHECK (json_valid(body) AND length(CAST(body AS BLOB)) <= 16384),
  received_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (project_id, event_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_telemetry_received ON telemetry_stream(project_id, received_at);

CREATE TABLE IF NOT EXISTS integrity_audits (
  project_id TEXT NOT NULL REFERENCES zones_registry(project_id),
  audit_id TEXT NOT NULL,
  entry_count INTEGER NOT NULL CHECK (entry_count >= 0),
  merkle_root TEXT NOT NULL CHECK (length(merkle_root) = 64 AND merkle_root NOT GLOB '*[^0-9a-f]*'),
  checked_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (project_id, audit_id)
) WITHOUT ROWID;

-- Additive schema for the existing nathan-ai-cockpit-ledger database.
-- Script source is archived PRIVATELY in D1, never in a public GitHub repo.
CREATE TABLE IF NOT EXISTS dispatch_script_registry (
  script_name TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  etag TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  created_on TEXT,
  modified_on TEXT,
  script_kind TEXT NOT NULL,
  handler_json TEXT NOT NULL,
  code_backup_status TEXT NOT NULL DEFAULT 'NOT_BACKED_UP',
  code_verified INTEGER NOT NULL DEFAULT 0,
  last_seen TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dispatch_kind ON dispatch_script_registry(script_kind);
CREATE TABLE IF NOT EXISTS dispatch_script_snapshots (
  script_name TEXT PRIMARY KEY,
  etag TEXT NOT NULL,
  modules_json TEXT NOT NULL,
  module_count INTEGER NOT NULL,
  source_bytes INTEGER NOT NULL,
  captured_at TEXT NOT NULL,
  capture_state TEXT NOT NULL DEFAULT 'CAPTURED'
);
CREATE TABLE IF NOT EXISTS language_shard_concordance (
  shard_name TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  first_glottocode TEXT,
  last_glottocode TEXT,
  record_count INTEGER NOT NULL,
  records_json TEXT NOT NULL,
  imported_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_language_shard_range ON language_shard_concordance(first_glottocode,last_glottocode);

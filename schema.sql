-- Additive D1 schema, compatible with the existing nathan-ai-cockpit-ledger.
CREATE TABLE IF NOT EXISTS cockpit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT NOT NULL,
  action TEXT NOT NULL,
  state INTEGER NOT NULL DEFAULT 1,
  payload TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS unified_catalog (
  uid TEXT PRIMARY KEY,
  source_db TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  repo_url TEXT,
  source_status TEXT NOT NULL,
  integration_status TEXT NOT NULL DEFAULT 'INDEXED',
  synced_to_github INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(source_db,source_table,source_id)
);
CREATE TABLE IF NOT EXISTS import_cursors (
  source_key TEXT PRIMARY KEY,
  row_offset INTEGER NOT NULL DEFAULT 0,
  complete INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cockpit_created ON cockpit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_sync ON unified_catalog(synced_to_github,integration_status);
CREATE INDEX IF NOT EXISTS idx_catalog_source ON unified_catalog(source_db,source_table);

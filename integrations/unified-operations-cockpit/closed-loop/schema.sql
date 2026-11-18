CREATE TABLE IF NOT EXISTS unified_catalog (
 uid TEXT PRIMARY KEY, source_db TEXT NOT NULL, source_table TEXT NOT NULL,
 source_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT,
 repo_url TEXT, source_status TEXT NOT NULL, integration_status TEXT NOT NULL DEFAULT 'INDEXED',
 synced_to_github INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
 UNIQUE(source_db,source_table,source_id)
);
CREATE INDEX IF NOT EXISTS unified_catalog_source_idx ON unified_catalog(source_db,source_table);
CREATE INDEX IF NOT EXISTS unified_catalog_state_idx ON unified_catalog(integration_status,synced_to_github);
CREATE TABLE IF NOT EXISTS import_runs (
 id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT NOT NULL, finished_at TEXT,
 state TEXT NOT NULL, summary TEXT
);
CREATE TABLE IF NOT EXISTS cockpit_log (
 id INTEGER PRIMARY KEY AUTOINCREMENT,tier TEXT NOT NULL,action TEXT NOT NULL,
 state INTEGER NOT NULL DEFAULT 1,payload TEXT,created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS cockpit_log_created_idx ON cockpit_log(created_at DESC);

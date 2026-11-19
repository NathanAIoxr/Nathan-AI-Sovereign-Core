CREATE TABLE IF NOT EXISTS zones_registry (
 project_id TEXT PRIMARY KEY,
 project_kind TEXT NOT NULL CHECK(project_kind IN ('website','book','app','game','other')),
 display_name TEXT NOT NULL,
 domain_name TEXT UNIQUE,
 zone_id TEXT UNIQUE,
 staging_url TEXT,
 launch_status TEXT NOT NULL DEFAULT 'HOLD' CHECK(launch_status IN ('HOLD','LIVE')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_zones_registry_status ON zones_registry(launch_status);
CREATE TABLE IF NOT EXISTS book_catalog (book_id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES zones_registry(project_id), title TEXT NOT NULL, asset_key TEXT);
CREATE INDEX IF NOT EXISTS idx_book_catalog_project ON book_catalog(project_id);
CREATE TABLE IF NOT EXISTS app_modules (module_id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES zones_registry(project_id), source_path TEXT NOT NULL, deployment_state TEXT NOT NULL DEFAULT 'staged');
CREATE INDEX IF NOT EXISTS idx_app_modules_project ON app_modules(project_id);
CREATE TABLE IF NOT EXISTS game_states (game_id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES zones_registry(project_id), state_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_game_states_project ON game_states(project_id);

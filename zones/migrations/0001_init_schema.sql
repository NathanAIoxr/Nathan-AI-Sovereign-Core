CREATE TABLE IF NOT EXISTS zones_registry (
  project_id TEXT PRIMARY KEY CHECK (
    length(project_id) BETWEEN 1 AND 100 AND project_id NOT GLOB '*[^a-z0-9-]*'
  ),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 250),
  kind TEXT NOT NULL CHECK (kind IN ('website','book','app','game','os','sos','agi','ai','si','ei','ae')),
  source_path TEXT NOT NULL UNIQUE,
  source_commit TEXT NOT NULL CHECK (length(source_commit) = 40),
  hostname TEXT UNIQUE CHECK (hostname IS NULL OR (hostname = lower(hostname) AND instr(hostname, '.') > 1)),
  cloudflare_zone_id TEXT UNIQUE CHECK (cloudflare_zone_id IS NULL OR length(cloudflare_zone_id) = 32),
  zone_status TEXT NOT NULL DEFAULT 'UNASSIGNED' CHECK (zone_status IN ('UNASSIGNED','PENDING','ACTIVE')),
  access_audience TEXT CHECK (access_audience IS NULL OR length(access_audience) = 64),
  launch_status TEXT NOT NULL DEFAULT 'HOLDING' CHECK (launch_status IN ('HOLDING','LIVE')),
  build_key TEXT CHECK (build_key IS NULL OR (length(build_key) = 40 AND build_key NOT GLOB '*[^a-f0-9]*')),
  entry_key TEXT NOT NULL DEFAULT 'index.html',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (zone_status = 'UNASSIGNED' OR (hostname IS NOT NULL AND cloudflare_zone_id IS NOT NULL)),
  CHECK (launch_status = 'HOLDING' OR (zone_status = 'ACTIVE' AND build_key IS NOT NULL))
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_zones_launch ON zones_registry(zone_status, launch_status, kind);

CREATE TABLE IF NOT EXISTS book_catalog (
  project_id TEXT NOT NULL REFERENCES zones_registry(project_id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  asset_key TEXT,
  PRIMARY KEY (project_id, book_id)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS app_modules (
  project_id TEXT NOT NULL REFERENCES zones_registry(project_id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  entry_key TEXT NOT NULL,
  PRIMARY KEY (project_id, module_id)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS game_states (
  project_id TEXT NOT NULL REFERENCES zones_registry(project_id) ON DELETE CASCADE,
  opaque_player_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  state_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(state_json)),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (project_id, game_id, opaque_player_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_game_states_updated ON game_states(project_id, updated_at);

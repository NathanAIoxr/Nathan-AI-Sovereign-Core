CREATE TABLE IF NOT EXISTS zones_registry (
  workspace_id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  project_kind TEXT NOT NULL,
  source_key TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  cloudflare_zone_id TEXT UNIQUE,
  domain_status TEXT NOT NULL DEFAULT 'unassigned' CHECK (domain_status IN ('unassigned','pending','active')),
  launch_status TEXT NOT NULL DEFAULT 'HOLDING' CHECK (launch_status IN ('HOLDING','LIVE')),
  public_url TEXT,
  CHECK (domain_status = 'unassigned' OR (domain IS NOT NULL AND cloudflare_zone_id IS NOT NULL)),
  CHECK (launch_status <> 'LIVE' OR (domain_status = 'active' AND public_url LIKE 'https://%'))
) STRICT;

CREATE TABLE IF NOT EXISTS book_catalog (
  workspace_id TEXT NOT NULL REFERENCES zones_registry(workspace_id),
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  PRIMARY KEY (workspace_id, book_id)
) STRICT;

CREATE TABLE IF NOT EXISTS app_modules (
  workspace_id TEXT NOT NULL REFERENCES zones_registry(workspace_id),
  module_id TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  PRIMARY KEY (workspace_id, module_id)
) STRICT;

CREATE TABLE IF NOT EXISTS game_states (
  workspace_id TEXT NOT NULL REFERENCES zones_registry(workspace_id),
  game_id TEXT NOT NULL,
  save_id TEXT NOT NULL,
  state_json TEXT NOT NULL CHECK (json_valid(state_json)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, game_id, save_id)
) STRICT;

CREATE INDEX IF NOT EXISTS zone_launch_status_idx ON zones_registry(launch_status, domain_status);

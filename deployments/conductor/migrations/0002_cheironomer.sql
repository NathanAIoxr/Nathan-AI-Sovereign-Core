CREATE TABLE IF NOT EXISTS virtual_zones (
  identity_id TEXT PRIMARY KEY,
  zone_state TEXT NOT NULL DEFAULT 'HOLD' CHECK (zone_state IN ('HOLD','REHEARSAL','READY_FOR_SWITCH','LAUNCHED','KILLED')),
  reader_role TEXT NOT NULL,
  manifest_json TEXT NOT NULL CHECK (json_valid(manifest_json)),
  manifest_hash TEXT NOT NULL,
  deployment_ref TEXT,
  bound_route TEXT,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_cheironomer_virtual_state ON virtual_zones(zone_state,identity_id);
CREATE TABLE IF NOT EXISTS dns_zone_fleet (
  domain TEXT PRIMARY KEY, batch_id TEXT NOT NULL, batch_position INTEGER NOT NULL CHECK (batch_position BETWEEN 1 AND 10),
  dns_zone_id TEXT NOT NULL UNIQUE, state TEXT NOT NULL CHECK (state IN ('HOLDING','LIVE')),
  updated_at TEXT NOT NULL, UNIQUE (batch_id,batch_position)
) STRICT;
CREATE TABLE IF NOT EXISTS recursive_nodes (
  node_id TEXT PRIMARY KEY, source_kind TEXT NOT NULL, status TEXT NOT NULL,
  is_terminal_root INTEGER NOT NULL CHECK (is_terminal_root IN (0,1)), observed_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_cheironomer_roots ON recursive_nodes(is_terminal_root,source_kind,node_id);
CREATE TABLE IF NOT EXISTS provenance_ledger (
  event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, prior_hash TEXT NOT NULL, alien_hash TEXT NOT NULL UNIQUE,
  neila_hash TEXT NOT NULL, payload_hash TEXT NOT NULL, created_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_cheironomer_provenance ON provenance_ledger(created_at,event_id);
CREATE TABLE IF NOT EXISTS voice_vault (
  event_id TEXT PRIMARY KEY, transcript TEXT NOT NULL, entities_json TEXT NOT NULL CHECK (json_valid(entities_json)),
  source_hash TEXT NOT NULL, created_at TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS extraction_log (
  event_id TEXT PRIMARY KEY, tile TEXT NOT NULL, payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at TEXT NOT NULL
) STRICT;

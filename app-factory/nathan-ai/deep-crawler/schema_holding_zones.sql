-- Sparse HOLD registry. No preallocation of virtual identities.
CREATE TABLE IF NOT EXISTS virtual_zones (
 identity_id TEXT PRIMARY KEY,
 zone_state TEXT NOT NULL DEFAULT 'HOLD' CHECK(zone_state IN ('HOLD','REHEARSAL','READY_FOR_SWITCH','LAUNCHED','KILLED')),
 reader_role TEXT NOT NULL CHECK(reader_role IN ('NATHAN_GH_BOT','NATHAN_CF_BOT','NATHAN_LINK_TRACER')),
 manifest_json TEXT NOT NULL, manifest_hash TEXT NOT NULL,
 bound_route TEXT, alien_proof TEXT, neila_proof TEXT,
 deployment_ref TEXT, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_virtual_zones_state ON virtual_zones(zone_state);
CREATE TABLE IF NOT EXISTS virtual_zone_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, identity_id TEXT NOT NULL,
 action TEXT NOT NULL, result TEXT NOT NULL, at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_zone_audit_identity ON virtual_zone_audit(identity_id);

-- Additive D1 schema for the existing tabor-global-import-catalog database.
-- Does NOT modify its original imported_workers table.
-- Apply only to an account-owned D1 database after reviewing permissions.
CREATE TABLE IF NOT EXISTS global_atlas_layers (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS global_atlas_components (
 id TEXT PRIMARY KEY,name TEXT NOT NULL,layer TEXT NOT NULL,
 source_type TEXT NOT NULL,status TEXT NOT NULL,observed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_global_atlas_components_layer ON global_atlas_components(layer);
CREATE TABLE IF NOT EXISTS global_atlas_sources (
 name TEXT PRIMARY KEY,url TEXT NOT NULL,observed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS global_atlas_public_repos (
 repo TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,
 url TEXT NOT NULL,fit TEXT,status TEXT NOT NULL,observed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS global_atlas_owner_resources (
 resource_type TEXT NOT NULL,resource_name TEXT NOT NULL,
 observed_at TEXT NOT NULL,PRIMARY KEY(resource_type,resource_name)
);
CREATE TABLE IF NOT EXISTS global_atlas_existing_fleet (
 fleet_id INTEGER PRIMARY KEY,batch_id INTEGER NOT NULL,local_id INTEGER NOT NULL,
 title TEXT,category TEXT,source_state TEXT NOT NULL,
 source_ref TEXT,worker_name TEXT,observed_at TEXT NOT NULL
);
-- Existing owner-account resource names remain in the private D1 database,
-- NOT in the public GitHub source or public Worker API.

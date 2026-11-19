CREATE TABLE IF NOT EXISTS sovereign_app_unit_shard_v1 (
 id TEXT PRIMARY KEY,
 job_id TEXT NOT NULL UNIQUE,
 item_count INTEGER NOT NULL CHECK(item_count>0),
 members_sha256 TEXT NOT NULL CHECK(length(members_sha256)=64)
);
CREATE TABLE IF NOT EXISTS sovereign_app_unit_v1 (
 id TEXT PRIMARY KEY CHECK(length(id)=8),
 title TEXT NOT NULL,
 kind TEXT NOT NULL,
 evidence_stage TEXT NOT NULL,
 source_json TEXT NOT NULL CHECK(json_valid(source_json)),
 source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
 workstream TEXT NOT NULL,
 next_action TEXT NOT NULL,
 shard_id TEXT NOT NULL REFERENCES sovereign_app_unit_shard_v1(id),
 repository_path TEXT NOT NULL,
 focus INTEGER NOT NULL DEFAULT 0,
 package_state TEXT NOT NULL DEFAULT 'queued' CHECK(package_state IN('queued','packaging','packaged','error')),
 lease_id TEXT,
 lease_until INTEGER,
 packages_attempted INTEGER NOT NULL DEFAULT 0,
 package_json TEXT CHECK(package_json IS NULL OR json_valid(package_json)),
 package_sha256 TEXT,
 packaged_at INTEGER,
 package_error TEXT
);
CREATE INDEX IF NOT EXISTS sovereign_app_unit_package_index_v1 ON sovereign_app_unit_v1(package_state, id);
CREATE TABLE IF NOT EXISTS sovereign_app_unit_feature_v1 (
 unit_id TEXT PRIMARY KEY REFERENCES sovereign_app_unit_v1(id),
 state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN('queued','working','verified','blocked')),
 lease_id TEXT,
 lease_until INTEGER,
 updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
 receipt_json TEXT CHECK(receipt_json IS NULL OR json_valid(receipt_json))
);

-- Additive restore schema for EXISTING nathan-ai-cockpit-ledger.
-- Does not drop, overwrite, or rename the existing unified_catalog.
CREATE TABLE IF NOT EXISTS restored_resources_v1 (
  uid TEXT PRIMARY KEY,
  source_db TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  resource_kind TEXT NOT NULL,
  custody TEXT NOT NULL,
  label TEXT NOT NULL,
  source_url TEXT,
  declared_status TEXT,
  operational_state TEXT NOT NULL,
  license_declared TEXT,
  original_record_json TEXT NOT NULL CHECK(json_valid(original_record_json)),
  code_snapshot_ref TEXT,
  observed_at TEXT,
  restored_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_restored_kind
  ON restored_resources_v1(resource_kind,operational_state);
CREATE INDEX IF NOT EXISTS idx_restored_origin
  ON restored_resources_v1(source_db,source_table);
CREATE TABLE IF NOT EXISTS restored_resource_links_v1 (
  from_uid TEXT NOT NULL,
  to_uid TEXT NOT NULL,
  relationship TEXT NOT NULL,
  evidence TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(from_uid,to_uid,relationship)
);
CREATE INDEX IF NOT EXISTS idx_restored_links_to
  ON restored_resource_links_v1(to_uid);
CREATE TABLE IF NOT EXISTS restoration_receipts_v1 (
  batch_key TEXT PRIMARY KEY,
  source_db TEXT NOT NULL,
  source_table TEXT NOT NULL,
  record_count INTEGER NOT NULL,
  matched_catalog INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- Source code acquisition stays separate from discovery. No license, no clone.
CREATE TABLE IF NOT EXISTS upstream_source_intake_v1 (
  resource_uid TEXT PRIMARY KEY,
  repository_url TEXT NOT NULL,
  original_fit TEXT,
  license_review_state TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
  code_acquisition_state TEXT NOT NULL DEFAULT 'NOT_FETCHED',
  pinned_commit TEXT,
  source_archive_ref TEXT,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL
);
INSERT INTO upstream_source_intake_v1(resource_uid,repository_url,original_fit,updated_at)
SELECT uid,source_url,json_extract(original_record_json,'$.fit'),CURRENT_TIMESTAMP
FROM restored_resources_v1
WHERE resource_kind='external_repository' AND source_url LIKE 'https://github.com/%'
ON CONFLICT(resource_uid) DO UPDATE SET
  repository_url=excluded.repository_url,
  original_fit=excluded.original_fit,
  updated_at=excluded.updated_at;

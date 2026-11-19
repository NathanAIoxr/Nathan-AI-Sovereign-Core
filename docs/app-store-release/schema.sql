CREATE TABLE IF NOT EXISTS app_store_release_jobs_v1 (
  app_key TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('ios','android')),
  source_ref TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  stage TEXT NOT NULL CHECK(stage IN ('source_review','native_product','native_ci','device_qa','listing','signing','release_candidate')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','blocked','prepared')),
  lease_owner TEXT,
  lease_until INTEGER,
  next_action TEXT NOT NULL,
  receipt_history_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(receipt_history_json) AND json_type(receipt_history_json)='array'),
  updated_at INTEGER NOT NULL DEFAULT(unixepoch()),
  PRIMARY KEY (app_key, platform),
  CHECK ((status='running' AND lease_owner IS NOT NULL AND lease_until IS NOT NULL) OR
         (status<>'running' AND lease_owner IS NULL AND lease_until IS NULL)),
  CHECK (status<>'prepared' OR (stage='release_candidate' AND json_array_length(receipt_history_json)>0))
);

CREATE INDEX IF NOT EXISTS app_store_release_queue_idx
ON app_store_release_jobs_v1(status, priority, updated_at);

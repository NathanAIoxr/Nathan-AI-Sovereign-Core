CREATE TABLE IF NOT EXISTS release_fleet_sources_v1 (
  manifest_path TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('station-manifest','app-manifest')),
  source_commit TEXT NOT NULL CHECK(length(source_commit)=40),
  updated_at INTEGER NOT NULL DEFAULT(unixepoch())
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS release_fleet_jobs_v1 (
  project_key TEXT NOT NULL,
  target TEXT NOT NULL CHECK(target IN ('website','book','os','compute')),
  source_path TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued','running','blocked','verified')),
  lease_owner TEXT,
  lease_until INTEGER,
  next_action TEXT NOT NULL,
  receipts TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(receipts) AND json_type(receipts)='array'),
  updated_at INTEGER NOT NULL DEFAULT(unixepoch()),
  PRIMARY KEY(project_key,target),
  CHECK((status='running' AND lease_owner IS NOT NULL AND lease_until IS NOT NULL) OR
        (status<>'running' AND lease_owner IS NULL AND lease_until IS NULL)),
  CHECK(status<>'verified' OR json_array_length(receipts)>0)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS release_fleet_work_v1 ON release_fleet_jobs_v1(target,status,updated_at);

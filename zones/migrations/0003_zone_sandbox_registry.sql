CREATE TABLE IF NOT EXISTS zone_sandboxes (
  project_id TEXT PRIMARY KEY REFERENCES zones_registry(project_id),
  staging_alias TEXT NOT NULL UNIQUE,
  dispatch_namespace TEXT NOT NULL UNIQUE,
  worker_name TEXT NOT NULL UNIQUE,
  database_id TEXT NOT NULL UNIQUE,
  bucket_name TEXT NOT NULL UNIQUE,
  kv_namespace_id TEXT NOT NULL UNIQUE,
  queue_id TEXT NOT NULL UNIQUE,
  durable_namespace_id TEXT NOT NULL UNIQUE,
  verified_at INTEGER NOT NULL DEFAULT (unixepoch())
) WITHOUT ROWID;

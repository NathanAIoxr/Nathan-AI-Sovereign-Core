CREATE TABLE IF NOT EXISTS game_station_jobs_v1 (
  app_id TEXT PRIMARY KEY,
  task TEXT NOT NULL CHECK (task IN ('build-source','recover-source')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','verified')),
  lease_owner TEXT,
  lease_until INTEGER,
  receipt TEXT,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((status='running' AND lease_owner IS NOT NULL AND lease_until IS NOT NULL) OR
         (status!='running' AND lease_owner IS NULL AND lease_until IS NULL)),
  CHECK (status!='verified' OR receipt IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS game_station_jobs_v1_status ON game_station_jobs_v1(status, task, lease_until, app_id);

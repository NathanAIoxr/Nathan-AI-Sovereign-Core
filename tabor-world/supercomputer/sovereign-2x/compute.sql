CREATE TABLE IF NOT EXISTS sovereign_compute_runs (
  run_id TEXT PRIMARY KEY,
  created_ms INTEGER NOT NULL,
  source TEXT NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt)),
  digest TEXT NOT NULL CHECK (length(digest)=64)
);

CREATE INDEX IF NOT EXISTS sovereign_compute_runs_created
ON sovereign_compute_runs(created_ms DESC,run_id);

CREATE TABLE IF NOT EXISTS sovereign_mesh_runs (
  id TEXT PRIMARY KEY,
  created_ms INTEGER NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt)),
  digest TEXT NOT NULL CHECK (length(digest)=64)
);
CREATE INDEX IF NOT EXISTS sovereign_mesh_runs_created ON sovereign_mesh_runs(created_ms DESC,id);

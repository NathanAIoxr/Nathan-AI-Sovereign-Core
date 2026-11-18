CREATE TABLE IF NOT EXISTS supercomputer_jobs (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  input TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','complete','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  lease TEXT,
  lease_until INTEGER,
  result TEXT,
  error TEXT,
  ready_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS supercomputer_jobs_queue ON supercomputer_jobs(status, created_at, id);

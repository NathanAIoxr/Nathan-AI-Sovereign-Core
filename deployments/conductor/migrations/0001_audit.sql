CREATE TABLE IF NOT EXISTS conductor_events (
  event_id TEXT PRIMARY KEY,
  job_id TEXT,
  event TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  details TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS conductor_events_job
  ON conductor_events(job_id, created_at);

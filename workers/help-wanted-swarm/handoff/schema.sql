CREATE TABLE IF NOT EXISTS repair_handoff_outbox (
  job_id TEXT PRIMARY KEY REFERENCES repair_jobs(id),
  job_status TEXT NOT NULL,
  source_updated_at INTEGER NOT NULL,
  source_receipt TEXT NOT NULL CHECK(json_valid(source_receipt)),
  note TEXT NOT NULL,
  draft_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS repair_handoff_runs (
  scheduled_at INTEGER PRIMARY KEY,
  refreshed_drafts INTEGER NOT NULL
);

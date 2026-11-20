CREATE TABLE IF NOT EXISTS zone_reader_runs (
  run_id TEXT NOT NULL,
  reader TEXT NOT NULL CHECK (reader IN ('github','cloudflare')),
  source_ref TEXT NOT NULL,
  rows_read INTEGER NOT NULL CHECK (rows_read>=0),
  candidates INTEGER NOT NULL CHECK(candidates>=0),
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reader,run_id)
) STRICT;
CREATE TABLE IF NOT EXISTS zone_reader_candidates (
  reader TEXT NOT NULL CHECK (reader IN ('github','cloudflare')),
  workspace_id TEXT NOT NULL REFERENCES zones_registry(workspace_id),
  candidate_key TEXT NOT NULL,
  action TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  evidence_json TEXT NOT NULL CHECK(json_valid(evidence_json)),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','reviewed','dismissed')),
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reader,workspace_id,candidate_key)
) STRICT;
CREATE INDEX IF NOT EXISTS zone_reader_review_idx
  ON zone_reader_candidates(review_status,observed_at DESC,workspace_id);

CREATE TABLE IF NOT EXISTS zone_reader_git_coverage (
  run_id TEXT PRIMARY KEY,
  commit_sha TEXT NOT NULL,
  summary_json TEXT NOT NULL CHECK(json_valid(summary_json)),
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

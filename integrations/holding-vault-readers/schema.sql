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

CREATE TABLE IF NOT EXISTS zone_reader_provenance_nodes (
  node_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  locator TEXT NOT NULL,
  resolution TEXT NOT NULL CHECK(resolution IN ('indexed','verified-leaf','external-reference','unresolved')),
  details_json TEXT NOT NULL CHECK(json_valid(details_json))
) STRICT;

CREATE TABLE IF NOT EXISTS zone_reader_provenance_edges (
  source_key TEXT NOT NULL REFERENCES zone_reader_provenance_nodes(node_key),
  target_key TEXT NOT NULL REFERENCES zone_reader_provenance_nodes(node_key),
  relation TEXT NOT NULL,
  PRIMARY KEY(source_key,target_key,relation)
) STRICT;

CREATE INDEX IF NOT EXISTS zone_reader_provenance_reverse_idx
  ON zone_reader_provenance_edges(target_key,source_key,relation);

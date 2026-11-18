CREATE TABLE IF NOT EXISTS true_cloud_jobs(id TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('inventory-audit','genesis-selftest','telemetry-check')),status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','completed','failed')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,started_at TEXT,completed_at TEXT,result_json TEXT);CREATE INDEX IF NOT EXISTS idx_true_cloud_jobs_queue ON true_cloud_jobs(status,created_at);
CREATE TABLE IF NOT EXISTS true_cloud_job_claims (
  job_id TEXT PRIMARY KEY REFERENCES true_cloud_jobs(id),
  token TEXT NOT NULL,
  expires_ms INTEGER NOT NULL,
  attempts INTEGER NOT NULL CHECK(attempts BETWEEN 1 AND 3)
);
CREATE UNIQUE INDEX IF NOT EXISTS true_cloud_claim_token ON true_cloud_job_claims(token);

CREATE TABLE IF NOT EXISTS true_cloud_receipts (
  job_id TEXT PRIMARY KEY REFERENCES true_cloud_jobs(id),
  body TEXT NOT NULL CHECK(json_valid(body)),
  sha256 TEXT NOT NULL CHECK(length(sha256)=64)
);

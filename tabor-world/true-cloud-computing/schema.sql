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

CREATE TABLE IF NOT EXISTS true_cloud_compute_jobs (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL CHECK(namespace IN ('pie-pi-phi','supercalifragilisticexpialidocious')),
  retry_key TEXT NOT NULL,
  request_sha TEXT NOT NULL,
  seed INTEGER NOT NULL CHECK(seed BETWEEN 0 AND 4294967295),
  terms INTEGER NOT NULL CHECK(terms BETWEEN 64 AND 4096),
  operation_budget INTEGER NOT NULL,
  budget_day TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('queued','running','completed','failed','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_ms INTEGER NOT NULL,
  updated_ms INTEGER NOT NULL,
  next_ms INTEGER NOT NULL,
  lease_owner TEXT,
  lease_until INTEGER,
  error_code TEXT,
  UNIQUE(namespace,retry_key)
);

CREATE INDEX IF NOT EXISTS true_cloud_compute_dispatch ON true_cloud_compute_jobs(state,next_ms,created_ms);
CREATE INDEX IF NOT EXISTS true_cloud_compute_quota ON true_cloud_compute_jobs(namespace,budget_day);

CREATE TABLE IF NOT EXISTS true_cloud_compute_events (
  seq INTEGER PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES true_cloud_compute_jobs(id),
  state TEXT NOT NULL,
  created_ms INTEGER NOT NULL,
  receipt TEXT CHECK(receipt IS NULL OR json_valid(receipt)),
  receipt_sha TEXT CHECK(receipt_sha IS NULL OR length(receipt_sha)=64)
);
CREATE INDEX IF NOT EXISTS true_cloud_compute_events_job ON true_cloud_compute_events(job_id,seq);

CREATE TRIGGER IF NOT EXISTS true_cloud_compute_admission
AFTER INSERT ON true_cloud_compute_jobs
BEGIN
  INSERT INTO true_cloud_compute_events(job_id,state,created_ms) VALUES(new.id,new.state,new.created_ms);
END;

CREATE TRIGGER IF NOT EXISTS true_cloud_compute_change
AFTER UPDATE OF state ON true_cloud_compute_jobs
WHEN new.state<>old.state
BEGIN
  INSERT INTO true_cloud_compute_events(job_id,state,created_ms) VALUES(new.id,new.state,new.updated_ms);
END;

CREATE TABLE IF NOT EXISTS true_cloud_compute_benchmarks (
  id TEXT PRIMARY KEY,
  scheduled_ms INTEGER NOT NULL,
  body TEXT NOT NULL CHECK(json_valid(body)),
  sha256 TEXT NOT NULL CHECK(length(sha256)=64)
);
CREATE INDEX IF NOT EXISTS true_cloud_compute_benchmarks_order ON true_cloud_compute_benchmarks(scheduled_ms DESC);

CREATE TABLE IF NOT EXISTS true_cloud_compute_keys (
  digest TEXT PRIMARY KEY CHECK(length(digest)=64),
  namespace TEXT NOT NULL CHECK(namespace IN ('pie-pi-phi','supercalifragilisticexpialidocious')),
  expires_ms INTEGER NOT NULL
);

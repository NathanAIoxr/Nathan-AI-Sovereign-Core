CREATE TABLE IF NOT EXISTS sovereign_jobs (id TEXT PRIMARY KEY, status TEXT NOT NULL, input_hash TEXT NOT NULL, created_at INTEGER NOT NULL, audited_at INTEGER);
CREATE TABLE IF NOT EXISTS sovereign_consensus (id TEXT PRIMARY KEY, job_id TEXT NOT NULL, model TEXT NOT NULL, response_hash TEXT NOT NULL, success INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sovereign_artifacts (id TEXT PRIMARY KEY, job_id TEXT NOT NULL, r2_key TEXT NOT NULL, sha256 TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sovereign_jobs_status ON sovereign_jobs(status,created_at);

CREATE TABLE IF NOT EXISTS conductor_control_v1 (scope TEXT PRIMARY KEY,paused INTEGER NOT NULL DEFAULT 1 CHECK(paused IN (0,1)),max_claims_per_cycle INTEGER NOT NULL DEFAULT 10 CHECK(max_claims_per_cycle BETWEEN 1 AND 100),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO conductor_control_v1(scope,paused) VALUES('global',1);
CREATE TABLE IF NOT EXISTS conductor_audit_v1 (audit_id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,project_id TEXT,job_id TEXT,details_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_conductor_audit_created ON conductor_audit_v1(created_at);
CREATE TABLE IF NOT EXISTS conductor_job_attempts_v1 (job_id TEXT NOT NULL,attempt INTEGER NOT NULL CHECK(attempt BETWEEN 1 AND 5),status TEXT NOT NULL CHECK(status IN ('started','succeeded','failed')),error_code TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(job_id,attempt));

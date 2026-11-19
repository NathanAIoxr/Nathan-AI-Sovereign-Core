CREATE TABLE IF NOT EXISTS app_registry (
  app_id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  deployment_target TEXT NOT NULL,
  health_url TEXT,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1))
);
CREATE TABLE IF NOT EXISTS deployment_jobs (
  job_id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES app_registry(app_id),
  commit_sha TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('DISCOVERED','VALIDATED','BUILT','TESTED','APPROVED','DEPLOYED','HEALTHY','BLOCKED','FAILED','ROLLED_BACK')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(app_id, commit_sha)
);
CREATE INDEX IF NOT EXISTS idx_deployment_jobs_app_state ON deployment_jobs(app_id, state);
CREATE INDEX IF NOT EXISTS idx_deployment_jobs_updated ON deployment_jobs(updated_at);

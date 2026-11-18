CREATE TABLE IF NOT EXISTS platform_jobs (
 id TEXT PRIMARY KEY, project TEXT NOT NULL, idem TEXT NOT NULL, request_hash TEXT NOT NULL,
 kind TEXT NOT NULL, payload TEXT, input_sha256 TEXT NOT NULL, state TEXT NOT NULL,
 created INTEGER NOT NULL, updated INTEGER NOT NULL, ready_at INTEGER NOT NULL, deadline INTEGER NOT NULL, retain_ms INTEGER NOT NULL,
 reserve_micro INTEGER NOT NULL, spent_micro INTEGER NOT NULL DEFAULT 0, attempt_charge INTEGER NOT NULL DEFAULT 0,
 backend TEXT, lease_token TEXT, lease_until INTEGER, attempt INTEGER NOT NULL DEFAULT 0,
 progress INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL, first_started INTEGER, finished INTEGER,
 checkpoint TEXT, output TEXT, output_sha256 TEXT, evidence TEXT, error TEXT,
 UNIQUE(project, idem),
 CHECK(state IN ('queued','running','succeeded','failed','cancelled','cleared')),
 CHECK(spent_micro >= 0 AND spent_micro <= reserve_micro)
);
CREATE INDEX IF NOT EXISTS platform_jobs_dispatch ON platform_jobs(state,ready_at,deadline);
CREATE INDEX IF NOT EXISTS platform_jobs_project ON platform_jobs(project,created DESC);
CREATE INDEX IF NOT EXISTS platform_jobs_leases ON platform_jobs(backend,state,lease_until);
CREATE TABLE IF NOT EXISTS platform_objects (
 id TEXT PRIMARY KEY, project TEXT NOT NULL, sha256 TEXT NOT NULL, bytes INTEGER NOT NULL,
 created INTEGER NOT NULL, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS platform_objects_expiry ON platform_objects(expires);
CREATE TABLE IF NOT EXISTS platform_benchmarks (
 id TEXT PRIMARY KEY, revision TEXT NOT NULL, recorded INTEGER NOT NULL,
 receipt TEXT NOT NULL, sha256 TEXT NOT NULL
);

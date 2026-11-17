CREATE TABLE IF NOT EXISTS repair_runtime (id TEXT PRIMARY KEY, checked_at INTEGER NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)));

CREATE TABLE IF NOT EXISTS repair_runtime_tasks (
 id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES repair_jobs(id),
 profile TEXT NOT NULL, input TEXT NOT NULL CHECK(json_valid(input)),
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RUNNING','PASSED','FAILED')),
 attempts INTEGER NOT NULL DEFAULT 0, lease TEXT, lease_until INTEGER,
 result TEXT CHECK(result IS NULL OR json_valid(result)), updated_at INTEGER NOT NULL DEFAULT(unixepoch())
);

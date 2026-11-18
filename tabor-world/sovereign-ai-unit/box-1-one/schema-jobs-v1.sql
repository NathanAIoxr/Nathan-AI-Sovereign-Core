-- Nathan AI job platform additive migration v1
CREATE TABLE IF NOT EXISTS nathan_backends (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL, region TEXT NOT NULL,
 accelerator TEXT NOT NULL, device_count INTEGER NOT NULL CHECK(device_count>=0),
 memory_mb INTEGER NOT NULL CHECK(memory_mb>=0), precision TEXT NOT NULL,
 runtimes TEXT NOT NULL, interconnect TEXT NOT NULL,
 max_concurrent INTEGER NOT NULL CHECK(max_concurrent>=0),
 reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved>=0),
 cost_usd_per_hour REAL NOT NULL DEFAULT 0 CHECK(cost_usd_per_hour>=0),
 enabled INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS nathan_jobs (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
 input_hash TEXT NOT NULL, input_text TEXT NOT NULL, workload TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('queued','reserved','running','completed','failed','cancelled')),
 stage TEXT NOT NULL, backend_id TEXT, attempt INTEGER NOT NULL DEFAULT 0,
 max_cost_usd REAL NOT NULL, estimated_cost_usd REAL NOT NULL DEFAULT 0,
 measured_cost_usd REAL, result_hash TEXT, artifact_key TEXT, error_code TEXT,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 lease_until INTEGER, cancelled_at INTEGER,
 UNIQUE(project_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_nathan_jobs_status ON nathan_jobs(status,created_at);
CREATE INDEX IF NOT EXISTS idx_nathan_jobs_project ON nathan_jobs(project_id,created_at);
CREATE TABLE IF NOT EXISTS nathan_job_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, job_id TEXT NOT NULL,
 stage TEXT NOT NULL, action TEXT NOT NULL, at INTEGER NOT NULL,
 detail TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS nathan_benchmark_receipts (
 id TEXT PRIMARY KEY, revision TEXT NOT NULL, workload TEXT NOT NULL,
 dataset_hash TEXT NOT NULL, model TEXT NOT NULL, hardware TEXT NOT NULL,
 precision TEXT NOT NULL, window_start INTEGER NOT NULL, window_end INTEGER NOT NULL,
 accepted INTEGER NOT NULL, failed INTEGER NOT NULL,
 p95_ms REAL, accepted_per_hour REAL, spend_usd REAL,
 raw_hash TEXT NOT NULL, raw_json TEXT NOT NULL
);
INSERT OR IGNORE INTO nathan_backends
(id,kind,region,accelerator,device_count,memory_mb,precision,runtimes,interconnect,max_concurrent,reserved,cost_usd_per_hour,enabled,updated_at)
VALUES ('workers-ai-default','managed-inference','cloudflare-managed','Workers AI',0,0,'model-dependent','["workers-ai"]','provider-managed',8,0,0,1,0);

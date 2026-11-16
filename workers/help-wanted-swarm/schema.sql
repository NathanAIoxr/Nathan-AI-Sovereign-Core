CREATE TABLE IF NOT EXISTS issue_queue (id INTEGER PRIMARY KEY CHECK (id = 1), observed_ms INTEGER NOT NULL, snapshot TEXT NOT NULL CHECK(json_valid(snapshot)));

CREATE TABLE IF NOT EXISTS repair_jobs (
  id TEXT PRIMARY KEY, scope TEXT NOT NULL CHECK(scope IN ('INTERNAL','GLOBAL')),
  provider TEXT NOT NULL, repository TEXT NOT NULL, number INTEGER NOT NULL,
  url TEXT NOT NULL, title TEXT NOT NULL, signal TEXT NOT NULL,
  source_at INTEGER NOT NULL, last_seen INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','LEASED','RETRY_WAIT','PATCH_READY','VERIFIED','IMPLEMENTED','DONE','NEEDS_REVIEW','WITHDRAWN')),
  attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 3,
  ready_at INTEGER NOT NULL DEFAULT 0, worker_id TEXT, request_id TEXT, lease_id TEXT, lease_until INTEGER,
  receipt TEXT CHECK(receipt IS NULL OR json_valid(receipt)), updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS repair_runnable ON repair_jobs(scope,status,ready_at,source_at,id);

CREATE INDEX IF NOT EXISTS repair_leases ON repair_jobs(status,lease_until);

CREATE TABLE IF NOT EXISTS repair_runs (
  lease_id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES repair_jobs(id),
  worker_id TEXT NOT NULL, request_id TEXT NOT NULL, attempt INTEGER NOT NULL,
  started_at INTEGER NOT NULL, finished_at INTEGER, outcome TEXT NOT NULL, receipt TEXT,
  UNIQUE(worker_id,request_id)
);

CREATE TABLE IF NOT EXISTS repair_sources (
  id TEXT PRIMARY KEY, cursor INTEGER NOT NULL DEFAULT 0, checked_at INTEGER, success_at INTEGER,
  sweep_started_at INTEGER, covered_through INTEGER, items INTEGER NOT NULL DEFAULT 0, error TEXT
);

CREATE TRIGGER IF NOT EXISTS repair_claim_receipt AFTER UPDATE OF lease_id ON repair_jobs
WHEN NEW.status='LEASED' AND NEW.lease_id IS NOT OLD.lease_id
BEGIN
  UPDATE repair_runs SET finished_at=unixepoch(), outcome='LEASE_EXPIRED'
  WHERE lease_id=OLD.lease_id AND outcome='RUNNING';
  INSERT INTO repair_runs(lease_id,job_id,worker_id,request_id,attempt,started_at,outcome)
  VALUES(NEW.lease_id,NEW.id,NEW.worker_id,NEW.request_id,NEW.attempts,unixepoch(),'RUNNING');
END;

CREATE TRIGGER IF NOT EXISTS repair_finish_receipt AFTER UPDATE OF status ON repair_jobs
WHEN OLD.status='LEASED' AND NEW.status<>'LEASED'
BEGIN
  UPDATE repair_runs SET finished_at=unixepoch(), outcome=NEW.status, receipt=NEW.receipt
  WHERE lease_id=OLD.lease_id AND outcome='RUNNING';
END;

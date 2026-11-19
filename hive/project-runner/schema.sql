CREATE TABLE IF NOT EXISTS runner_jobs (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('code','manuscript','both')),
  root TEXT NOT NULL,
  brief TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS runner_tasks (
  job_id TEXT NOT NULL REFERENCES runner_jobs(id),
  id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  role TEXT NOT NULL,
  instruction TEXT NOT NULL,
  acceptance TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','running','accepted','blocked')),
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL,
  available_at INTEGER NOT NULL,
  lease_id TEXT,
  lease_until INTEGER,
  receipt TEXT,
  PRIMARY KEY (job_id,id)
);

CREATE TABLE IF NOT EXISTS runner_dependencies (
  job_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  dependency_id TEXT NOT NULL,
  PRIMARY KEY (job_id,task_id,dependency_id),
  FOREIGN KEY (job_id,task_id) REFERENCES runner_tasks(job_id,id),
  FOREIGN KEY (job_id,dependency_id) REFERENCES runner_tasks(job_id,id)
);

CREATE TABLE IF NOT EXISTS runner_receipts (
  job_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  lease_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  receipt TEXT NOT NULL,
  PRIMARY KEY (job_id,task_id,attempt),
  FOREIGN KEY (job_id,task_id) REFERENCES runner_tasks(job_id,id)
);

CREATE INDEX IF NOT EXISTS runner_runnable
  ON runner_tasks(job_id,role,state,available_at,ordinal);

CREATE TRIGGER IF NOT EXISTS runner_record_receipt
AFTER UPDATE OF state ON runner_tasks
WHEN OLD.state='running' AND NEW.state<>'running'
BEGIN
  INSERT INTO runner_receipts (job_id,task_id,attempt,lease_id,outcome,receipt)
  VALUES (NEW.job_id,NEW.id,NEW.attempt,OLD.lease_id,NEW.state,NEW.receipt);
END;

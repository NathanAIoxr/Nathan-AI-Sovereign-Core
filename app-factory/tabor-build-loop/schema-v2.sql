CREATE TABLE IF NOT EXISTS build_plans (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  request_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS build_job_meta (
  job_id TEXT PRIMARY KEY REFERENCES build_queue(id),
  plan_id TEXT REFERENCES build_plans(id),
  task_key TEXT,
  position INTEGER,
  cancelled_at INTEGER,
  UNIQUE(plan_id,task_key)
);

CREATE TABLE IF NOT EXISTS build_dependencies (
  job_id TEXT NOT NULL REFERENCES build_queue(id),
  needs_id TEXT NOT NULL REFERENCES build_queue(id),
  PRIMARY KEY (job_id,needs_id)
);

CREATE INDEX IF NOT EXISTS build_dependency_reverse ON build_dependencies(needs_id,job_id);
CREATE INDEX IF NOT EXISTS build_jobs_by_plan ON build_job_meta(plan_id,position);

CREATE TABLE IF NOT EXISTS build_control (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  paused INTEGER NOT NULL CHECK(paused IN (0,1)),
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO build_control(singleton,paused,updated_at) VALUES(1,0,0);

CREATE TABLE IF NOT EXISTS build_events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL REFERENCES build_queue(id),
  event TEXT NOT NULL,
  detail TEXT,
  when_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS build_events_job ON build_events(job_id,seq);

CREATE TRIGGER IF NOT EXISTS build_event_queue
AFTER INSERT ON build_queue
BEGIN
  INSERT INTO build_events(job_id,event,detail,when_at) VALUES(NEW.id,'queued',NEW.kind,NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS build_event_state
AFTER UPDATE OF status ON build_queue
WHEN NEW.status <> OLD.status
BEGIN
  INSERT INTO build_events(job_id,event,detail,when_at)
  VALUES(NEW.id,NEW.status,COALESCE(NEW.last_error,NEW.publish_status),unixepoch()*1000);
END;

CREATE TRIGGER IF NOT EXISTS build_event_check
AFTER UPDATE OF code_sha256 ON build_queue
WHEN NEW.code_sha256 IS NOT NULL AND NEW.code_sha256 IS NOT OLD.code_sha256
BEGIN
  INSERT INTO build_events(job_id,event,detail,when_at)
  VALUES(NEW.id,'syntax_verified',NEW.code_sha256,unixepoch()*1000);
END;

CREATE TRIGGER IF NOT EXISTS build_event_cancel_insert
AFTER INSERT ON build_job_meta
WHEN NEW.cancelled_at IS NOT NULL
BEGIN
  INSERT INTO build_events(job_id,event,when_at) VALUES(NEW.job_id,'cancelled',NEW.cancelled_at);
END;

CREATE TRIGGER IF NOT EXISTS build_event_cancel_change
AFTER UPDATE OF cancelled_at ON build_job_meta
WHEN NEW.cancelled_at IS NOT OLD.cancelled_at
BEGIN
  INSERT INTO build_events(job_id,event,when_at)
  VALUES(NEW.job_id,CASE WHEN NEW.cancelled_at IS NULL THEN 'reopened' ELSE 'cancelled' END,
    COALESCE(NEW.cancelled_at,unixepoch()*1000));
END;

CREATE VIEW IF NOT EXISTS build_job_state AS
WITH RECURSIVE blocked(id) AS (
  SELECT id FROM build_queue WHERE status='failed'
  UNION SELECT job_id FROM build_job_meta WHERE cancelled_at IS NOT NULL
  UNION SELECT d.job_id FROM build_dependencies d JOIN blocked b ON d.needs_id=b.id
)
SELECT q.id,q.file_path,q.kind,q.provider,q.code_sha256,q.publish_status,q.commit_url,q.attempts,
  q.last_error,q.created_at,q.finished_at,m.plan_id,m.task_key,m.position,
  CASE
   WHEN m.cancelled_at IS NOT NULL THEN 'cancelled'
   WHEN q.status='pending' AND q.id IN (SELECT id FROM blocked) THEN 'blocked'
   WHEN q.status='pending' AND EXISTS (
     SELECT 1 FROM build_dependencies d JOIN build_queue k ON k.id=d.needs_id
     WHERE d.job_id=q.id AND k.status NOT IN ('generated','published')
   ) THEN 'waiting'
   ELSE q.status
  END AS status
FROM build_queue q LEFT JOIN build_job_meta m ON q.id=m.job_id;

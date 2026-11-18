-- Nathan Mind 202: additive, migration-safe D1 schema
CREATE TABLE IF NOT EXISTS nt_units (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('worker','bot')),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  script_name TEXT,
  route TEXT,
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS nt_jobs (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL REFERENCES nt_units(id),
  task_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','claimed','needs_approval','done','failed','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),
  approved_at TEXT,
  claimed_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS nt_jobs_state_idx ON nt_jobs(state, created_at);
CREATE TABLE IF NOT EXISTS nt_verbatim (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  verbatim_locked INTEGER NOT NULL DEFAULT 1 CHECK(verbatim_locked=1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS nt_verbatim_no_update BEFORE UPDATE ON nt_verbatim
BEGIN SELECT RAISE(ABORT, 'verbatim_locked'); END;
CREATE TRIGGER IF NOT EXISTS nt_verbatim_no_delete BEFORE DELETE ON nt_verbatim
BEGIN SELECT RAISE(ABORT, 'verbatim_locked'); END;
CREATE TABLE IF NOT EXISTS nt_audit (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_station_source_audit_v1 (
  app_id TEXT PRIMARY KEY REFERENCES game_station_jobs_v1(app_id),
  audit_commit TEXT NOT NULL,
  source_state TEXT NOT NULL CHECK (source_state IN (
    'declared-repository-path', 'declared-path-missing', 'declared-url',
    'repository-candidate', 'source-recovery'
  )),
  candidates_json TEXT NOT NULL CHECK (json_valid(candidates_json)),
  draft_plan_id TEXT REFERENCES build_plans(id),
  draft_task_key TEXT,
  checked_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK ((draft_plan_id IS NULL) = (draft_task_key IS NULL))
);

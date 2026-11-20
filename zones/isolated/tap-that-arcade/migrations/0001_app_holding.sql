CREATE TABLE IF NOT EXISTS staged_app (
  project_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  staging_alias TEXT NOT NULL UNIQUE,
  launch_status TEXT NOT NULL DEFAULT 'HOLDING' CHECK (launch_status = 'HOLDING'),
  fixture_count INTEGER NOT NULL CHECK (fixture_count >= 0)
);

CREATE TABLE IF NOT EXISTS atlas_project_checks(
  project TEXT PRIMARY KEY,
  checked_at INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('reachable','unavailable','redirect','restricted')),
  http INTEGER
);

CREATE TABLE IF NOT EXISTS atlas_audit(
  id INTEGER PRIMARY KEY CHECK(id=1),
  checked_at INTEGER NOT NULL,
  ledger_ok INTEGER NOT NULL CHECK(ledger_ok IN (0,1))
);

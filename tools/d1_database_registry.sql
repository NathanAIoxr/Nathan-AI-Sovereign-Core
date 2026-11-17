CREATE TABLE IF NOT EXISTS database_registry (
  name TEXT PRIMARY KEY,
  database_id TEXT UNIQUE,
  source_kind TEXT NOT NULL,
  source_ref TEXT,
  status TEXT NOT NULL CHECK(status IN ('verified_snapshot','existing','empty','source_required','backend_required')),
  observed_at TEXT NOT NULL,
  logical_table_count INTEGER CHECK(logical_table_count >= 0),
  source_sha256 TEXT CHECK(source_sha256 IS NULL OR length(source_sha256)=64),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS snapshot_table_counts (
  database_name TEXT NOT NULL REFERENCES database_registry(name),
  table_name TEXT NOT NULL,
  source_count INTEGER NOT NULL CHECK(source_count >= 0),
  live_count INTEGER NOT NULL CHECK(live_count >= 0),
  PRIMARY KEY(database_name, table_name)
);

CREATE VIEW IF NOT EXISTS verified_snapshots AS
  SELECT r.name,r.source_kind,r.source_ref,r.observed_at,r.logical_table_count,r.source_sha256,
         SUM(CASE WHEN c.source_count=c.live_count THEN 1 ELSE 0 END) AS matching_tables
  FROM database_registry r
  JOIN snapshot_table_counts c ON c.database_name=r.name
  WHERE r.status='verified_snapshot'
  GROUP BY r.name;

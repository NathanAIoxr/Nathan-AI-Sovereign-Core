CREATE TABLE IF NOT EXISTS languoid (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('language','dialect','family')),
  iso TEXT,
  family TEXT,
  parent_language TEXT,
  macroarea TEXT,
  first_documented INTEGER,
  last_documented INTEGER,
  sign INTEGER CHECK(sign IN (0,1))
);
CREATE INDEX IF NOT EXISTS languoid_name ON languoid(name COLLATE NOCASE, id);
CREATE INDEX IF NOT EXISTS languoid_kind_name ON languoid(kind, name COLLATE NOCASE, id);
CREATE INDEX IF NOT EXISTS languoid_iso ON languoid(iso);
CREATE TABLE IF NOT EXISTS catalog_release (id TEXT PRIMARY KEY, records INTEGER NOT NULL);

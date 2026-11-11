-- Optional PostgreSQL worlds-atlas schema; no live database migration executed.
CREATE TABLE IF NOT EXISTS mespark_worlds (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 type TEXT NOT NULL,
 region TEXT,
 latitude DOUBLE PRECISION CHECK(latitude BETWEEN -90 AND 90),
 longitude DOUBLE PRECISION CHECK(longitude BETWEEN -180 AND 180),
 relationship TEXT NOT NULL,
 description TEXT NOT NULL,
 source_label TEXT,
 era TEXT,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mespark_worlds_type_idx ON mespark_worlds(type);
CREATE TABLE IF NOT EXISTS mespark_world_links (
 id TEXT PRIMARY KEY,
 source_world TEXT NOT NULL REFERENCES mespark_worlds(id),
 target_world TEXT NOT NULL REFERENCES mespark_worlds(id),
 relation TEXT NOT NULL,
 evidence_status TEXT NOT NULL,
 source_uri TEXT,
 notes TEXT
);

CREATE TABLE IF NOT EXISTS tabor_imagination_releases (
  sha256 TEXT PRIMARY KEY CHECK (length(sha256) = 64),
  object_key TEXT NOT NULL UNIQUE,
  bytes INTEGER NOT NULL CHECK (bytes > 0),
  engine_count INTEGER NOT NULL CHECK (engine_count = 101),
  categories TEXT NOT NULL CHECK (json_valid(categories))
) STRICT;

CREATE TABLE IF NOT EXISTS tabor_imagination_engines (
  release_sha256 TEXT NOT NULL REFERENCES tabor_imagination_releases(sha256),
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 101),
  entry TEXT NOT NULL CHECK (json_valid(entry)),
  PRIMARY KEY (release_sha256, number)
) STRICT;

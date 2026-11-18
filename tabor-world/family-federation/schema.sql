CREATE TABLE IF NOT EXISTS tabor_family_federation_snapshot (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  observed_ms INTEGER NOT NULL,
  roster_json TEXT NOT NULL CHECK(json_valid(roster_json)),
  sha256 TEXT NOT NULL CHECK(length(sha256)=64)
);

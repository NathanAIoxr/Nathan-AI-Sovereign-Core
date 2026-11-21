CREATE TABLE IF NOT EXISTS nutsy_archive_snapshots (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    lookup TEXT NOT NULL,
    source_url TEXT NOT NULL,
    retrieved_at TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    r2_key TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS nutsy_archive_snapshots_lookup
    ON nutsy_archive_snapshots (provider, lookup, retrieved_at);
CREATE TABLE IF NOT EXISTS nutsy_archive_entities (
    snapshot_id TEXT NOT NULL REFERENCES nutsy_archive_snapshots(id),
    entity_id TEXT NOT NULL,
    canonical_url TEXT,
    source_version TEXT,
    PRIMARY KEY (snapshot_id, entity_id)
);
CREATE TABLE IF NOT EXISTS nutsy_archive_cooldowns (
    provider TEXT PRIMARY KEY,
    until_ms INTEGER NOT NULL
);

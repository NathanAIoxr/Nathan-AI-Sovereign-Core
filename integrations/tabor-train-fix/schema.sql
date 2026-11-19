-- Idempotent additive schema. Apply as a D1 migration before first request.
CREATE TABLE IF NOT EXISTS sovereign_records (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 tier INTEGER NOT NULL,
 anchor TEXT NOT NULL,
 content TEXT NOT NULL,
 sha256_hash TEXT NOT NULL,
 prev_hash TEXT NOT NULL,
 verbatim_locked INTEGER NOT NULL DEFAULT 1 CHECK(verbatim_locked=1),
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sovereign_records_created ON sovereign_records(created_at);

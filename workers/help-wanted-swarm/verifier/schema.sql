CREATE TABLE IF NOT EXISTS repair_patch_checks (
    job_id TEXT PRIMARY KEY REFERENCES repair_jobs(id),
    source_receipt TEXT NOT NULL CHECK (json_valid(source_receipt)),
    checked_at INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SOURCE_MATCH', 'SOURCE_UNAVAILABLE', 'REVIEW')),
    base TEXT,
    files INTEGER NOT NULL,
    hunks INTEGER NOT NULL,
    reason TEXT,
    execution TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS repair_pinned_sources (
    repository TEXT NOT NULL,
    base TEXT NOT NULL,
    path TEXT NOT NULL,
    present INTEGER NOT NULL CHECK (present IN (0, 1)),
    source TEXT,
    sha256 TEXT,
    git_blob TEXT,
    git_tree TEXT NOT NULL,
    imported_at INTEGER NOT NULL,
    PRIMARY KEY (repository, base, path),
    CHECK ((present = 0 AND source IS NULL AND sha256 IS NULL AND git_blob IS NULL)
        OR (present = 1 AND source IS NOT NULL AND sha256 IS NOT NULL AND git_blob IS NOT NULL))
);

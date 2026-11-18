-- Additive registry only. Existing databases and deployed workers remain untouched.
CREATE TABLE IF NOT EXISTS supercomputer_registry (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'specified', provenance TEXT NOT NULL,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS supercomputer_receipts (
 id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL,
 details TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_supercomputer_registry_kind ON supercomputer_registry(kind);

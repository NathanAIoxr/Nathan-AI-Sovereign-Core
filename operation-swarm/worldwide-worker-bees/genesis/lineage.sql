PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS genomes (
 id TEXT PRIMARY KEY,
 family TEXT NOT NULL,
 generation INTEGER NOT NULL CHECK(generation>=0),
 status TEXT NOT NULL CHECK(status IN ('sandbox','approved','retired')),
 skills_json TEXT NOT NULL,
 permissions_json TEXT NOT NULL DEFAULT '[]',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS parent_links (
 child_id TEXT NOT NULL REFERENCES genomes(id),
 parent_id TEXT NOT NULL REFERENCES genomes(id),
 PRIMARY KEY(child_id,parent_id),
 CHECK(child_id<>parent_id)
);
CREATE TABLE IF NOT EXISTS examinations (
 child_id TEXT NOT NULL REFERENCES genomes(id),
 exam_id TEXT NOT NULL,
 passed INTEGER NOT NULL CHECK(passed IN (0,1)),
 detail TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(child_id,exam_id)
);
CREATE TABLE IF NOT EXISTS audit_receipts (
 id TEXT PRIMARY KEY,
 subject_id TEXT NOT NULL,
 action TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_genomes_family ON genomes(family,generation);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_links(parent_id);
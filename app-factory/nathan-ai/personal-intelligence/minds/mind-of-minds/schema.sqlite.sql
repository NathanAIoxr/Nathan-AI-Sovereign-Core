-- Additive Personal Intelligence mind registry. Original Vault content is not changed.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS mind_definitions (
 mind_id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 category TEXT NOT NULL,
 group_name TEXT,
 purpose TEXT,
 status TEXT NOT NULL,
 source_id TEXT,
 tags_json TEXT NOT NULL DEFAULT '[]',
 disclaimer TEXT,
 definition_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_minds_category ON mind_definitions(category);
CREATE INDEX IF NOT EXISTS idx_minds_status ON mind_definitions(status);
CREATE TABLE IF NOT EXISTS conceptual_namespaces (
 namespace_id TEXT PRIMARY KEY,
 capacity_decimal TEXT NOT NULL,
 start_id_decimal TEXT NOT NULL,
 last_id_decimal TEXT NOT NULL,
 allocated_count INTEGER NOT NULL DEFAULT 0 CHECK(allocated_count>=0),
 description TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS module_references (
 module_id TEXT PRIMARY KEY,
 label TEXT NOT NULL,
 relative_path TEXT,
 role TEXT,
 implemented_status TEXT NOT NULL DEFAULT 'external-existing-not-modified'
);
CREATE TABLE IF NOT EXISTS mind_links (
 source_mind_id TEXT NOT NULL REFERENCES mind_definitions(mind_id),
 target_mind_id TEXT NOT NULL REFERENCES mind_definitions(mind_id),
 relation TEXT NOT NULL,
 notes TEXT,
 PRIMARY KEY(source_mind_id,target_mind_id,relation)
);
CREATE TABLE IF NOT EXISTS source_reviews (
 review_id INTEGER PRIMARY KEY,
 source_id TEXT NOT NULL,
 tier TEXT NOT NULL CHECK(tier IN ('CERO','UNO','DOS')),
 original_verbatim TEXT,
 derived_analysis TEXT,
 evidence_refs_json TEXT NOT NULL DEFAULT '[]',
 reviewed_at TEXT,
 CHECK(tier != 'UNO' OR evidence_refs_json != '[]')
);
CREATE TABLE IF NOT EXISTS proposed_jobs (
 job_id TEXT PRIMARY KEY,
 mind_id TEXT NOT NULL REFERENCES mind_definitions(mind_id),
 query TEXT NOT NULL,
 source_ids_json TEXT NOT NULL DEFAULT '[]',
 stage TEXT NOT NULL CHECK(stage IN ('CERO','UNO','DOS')),
 approval TEXT NOT NULL DEFAULT 'not-approved',
 execution TEXT NOT NULL DEFAULT 'not-executed'
);
CREATE VIRTUAL TABLE IF NOT EXISTS mind_search USING fts5(mind_id UNINDEXED,name,group_name,purpose,tags);

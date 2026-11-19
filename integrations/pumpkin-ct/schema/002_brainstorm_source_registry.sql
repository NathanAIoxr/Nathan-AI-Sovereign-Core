-- D1 additive schema draft. Apply only after checking target database and backup.
CREATE TABLE IF NOT EXISTS pp_source_messages (
 source_id TEXT PRIMARY KEY,
 origin TEXT NOT NULL,
 original_text TEXT NOT NULL,
 sha256 TEXT NOT NULL,
 captured_at TEXT NOT NULL,
 completeness TEXT NOT NULL CHECK (completeness IN ('verbatim','excerpt','summary'))
);
CREATE TABLE IF NOT EXISTS pp_opportunity_ideas (
 idea_id TEXT PRIMARY KEY,
 source_id TEXT NOT NULL REFERENCES pp_source_messages(source_id),
 title TEXT NOT NULL,
 category TEXT NOT NULL,
 description TEXT NOT NULL,
 decision TEXT NOT NULL DEFAULT 'UNDECIDED'
 CHECK (decision IN ('UNDECIDED','ADOPT','MODIFY','BUILD_DIFFERENTLY','DEFER','REJECT')),
 implementation_status TEXT NOT NULL DEFAULT 'IDEA'
 CHECK (implementation_status IN ('IDEA','SOURCE_FOUND','PROTOTYPE','TESTED','DEPLOYED','VERIFIED'))
);
CREATE INDEX IF NOT EXISTS idx_pp_ideas_source ON pp_opportunity_ideas(source_id);

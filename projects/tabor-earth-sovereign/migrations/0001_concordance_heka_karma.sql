-- Tabor Concordance: independently sourced lexical and conceptual records
CREATE TABLE IF NOT EXISTS lexical_nodes (
 id TEXT PRIMARY KEY, display_text TEXT NOT NULL, language TEXT,
 script TEXT, transliteration TEXT, meaning TEXT, node_type TEXT NOT NULL,
 source_url TEXT, evidence_status TEXT NOT NULL DEFAULT 'unverified',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS lexical_edges (
 id TEXT PRIMARY KEY, from_id TEXT NOT NULL REFERENCES lexical_nodes(id),
 to_id TEXT NOT NULL REFERENCES lexical_nodes(id),
 relation TEXT NOT NULL, evidence_status TEXT NOT NULL,
 source_url TEXT, explanation TEXT
);
CREATE TABLE IF NOT EXISTS concept_modules (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, tradition TEXT,
 definition TEXT, enabled INTEGER NOT NULL DEFAULT 0,
 source_url TEXT, review_status TEXT NOT NULL DEFAULT 'draft'
);
INSERT OR IGNORE INTO lexical_nodes (id,display_text,language,node_type,evidence_status) VALUES
('egypt','EGYPT','English','place_name','documented'),
('tpyge','TPYGE',NULL,'reversal','computed'),
('heka','heka','Ancient Egyptian','concept','needs_source_review'),
('akeh','akeh',NULL,'reversal','computed'),
('dine','DINE',NULL,'spelling','computed'),
('enid','ENID','Welsh / English','name','documented');
INSERT OR IGNORE INTO lexical_edges(id,from_id,to_id,relation,evidence_status,explanation) VALUES
('egypt-reverse','egypt','tpyge','exact_reversal','computed','Spelling reversal only; no established linguistic derivation from tipi or Greek pyge.'),
('heka-reverse','heka','akeh','exact_reversal','computed','Spelling reversal; not a demonstrated ancient Egyptian root.');
INSERT OR IGNORE INTO concept_modules(id,name,tradition,definition,enabled) VALUES
('heka','Heka','Ancient Egyptian','Magic or efficacious power; examine historical sources.',1),
('dharma','Dharma','South Asian traditions','Context-dependent duty, teaching, law and order.',1),
('karma','Karma','South Asian traditions','Action and its consequences in philosophical and religious systems; not an automated judgment of people.',1);

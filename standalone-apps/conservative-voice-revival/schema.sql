-- The Conservative Voice / Nathan Tabor Way — modern D1 schema
-- Historic public archive references are evidence links, not copied article bodies.
CREATE TABLE IF NOT EXISTS articles (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 slug TEXT UNIQUE NOT NULL,
 title TEXT NOT NULL,
 author TEXT NOT NULL,
 category TEXT NOT NULL,
 summary TEXT NOT NULL DEFAULT '',
 body TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 provenance TEXT NOT NULL DEFAULT 'new' CHECK(provenance IN ('new','original','reference')),
 source_url TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS articles_public_idx ON articles(status, created_at DESC);
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category,status);
CREATE TABLE IF NOT EXISTS archive_sources (
 source_id TEXT PRIMARY KEY,
 capture_date TEXT NOT NULL,
 kind TEXT NOT NULL,
 url TEXT NOT NULL,
 evidence TEXT NOT NULL CHECK(evidence IN ('verified_html','verified_text','verified_xml','verified_css','negative_capture')),
 note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS archive_date_idx ON archive_sources(capture_date);
CREATE TABLE IF NOT EXISTS discussion_topics (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 category TEXT NOT NULL DEFAULT 'Political Opinion',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected'))
);
CREATE TABLE IF NOT EXISTS discussion_posts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 topic_id INTEGER NOT NULL REFERENCES discussion_topics(id),
 display_name TEXT NOT NULL,
 body TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS discussion_approved_idx ON discussion_posts(topic_id,status);

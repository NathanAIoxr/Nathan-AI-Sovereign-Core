CREATE TABLE IF NOT EXISTS cloud_slayer_tools (
  id INTEGER PRIMARY KEY,
  tool_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('worker', 'app', 'guide', 'library')),
  source_path TEXT NOT NULL,
  source_ref TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cloud_slayer_tool_count (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  total INTEGER NOT NULL CHECK (total >= 0)
);
INSERT OR IGNORE INTO cloud_slayer_tool_count (singleton, total)
SELECT 1, count(*) FROM cloud_slayer_tools;

CREATE VIRTUAL TABLE IF NOT EXISTS cloud_slayer_tool_search
USING fts5(tool_key, title, description, tags, tokenize = 'unicode61', prefix = '2 3');

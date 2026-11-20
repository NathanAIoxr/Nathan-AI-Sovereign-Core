CREATE TABLE IF NOT EXISTS card_research_sources (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('wikipedia','nathan-archive')),
  title TEXT NOT NULL,
  search_title TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('game-lead','reference','owner-reference')),
  url TEXT NOT NULL,
  revision INTEGER,
  revision_url TEXT,
  categories TEXT NOT NULL CHECK (json_valid(categories)),
  linked_game TEXT REFERENCES card_games(id),
  source_position INTEGER
);
CREATE INDEX IF NOT EXISTS card_research_source_title ON card_research_sources(source,search_title,id);
CREATE INDEX IF NOT EXISTS card_research_game ON card_research_sources(linked_game);
CREATE TABLE IF NOT EXISTS card_research_specs (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL UNIQUE,
  definition TEXT NOT NULL CHECK (json_valid(definition)),
  url TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS card_research_runs (
  receipt_id TEXT PRIMARY KEY,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  evidence TEXT NOT NULL CHECK (json_valid(evidence)),
  conductor_receipt TEXT NOT NULL CHECK (json_valid(conductor_receipt))
);

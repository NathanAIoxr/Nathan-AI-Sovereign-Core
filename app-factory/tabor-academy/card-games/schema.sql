CREATE TABLE IF NOT EXISTS card_games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  family TEXT NOT NULL,
  region TEXT NOT NULL,
  players TEXT NOT NULL,
  deck TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('documented','reconstructed','original','indexed','fragment')),
  aliases TEXT NOT NULL CHECK (json_valid(aliases)),
  sources TEXT NOT NULL CHECK (json_valid(sources)),
  rulebook TEXT CHECK (rulebook IS NULL OR json_valid(rulebook)),
  engine TEXT,
  research TEXT,
  search_text TEXT NOT NULL,
  CHECK (engine IS NULL OR rulebook IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS card_games_title ON card_games(title COLLATE NOCASE, id);
CREATE INDEX IF NOT EXISTS card_games_status_family ON card_games(status, family, title COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS card_lessons (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL UNIQUE,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL CHECK (json_valid(body)),
  game_id TEXT REFERENCES card_games(id)
);
CREATE TABLE IF NOT EXISTS card_imports (
  release TEXT PRIMARY KEY,
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  game_count INTEGER NOT NULL,
  lesson_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public_editions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  manuscript TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

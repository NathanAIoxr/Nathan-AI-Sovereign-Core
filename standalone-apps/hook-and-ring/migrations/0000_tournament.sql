CREATE TABLE IF NOT EXISTS ranked_rounds (
  token TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  started_ms INTEGER NOT NULL,
  expires_ms INTEGER NOT NULL,
  alias TEXT,
  score INTEGER,
  duration_ms INTEGER,
  submitted_ms INTEGER
);

CREATE INDEX IF NOT EXISTS ranked_rounds_board ON ranked_rounds(day, score DESC, duration_ms, submitted_ms) WHERE score IS NOT NULL;

CREATE INDEX IF NOT EXISTS ranked_rounds_expiry ON ranked_rounds(expires_ms) WHERE score IS NULL;

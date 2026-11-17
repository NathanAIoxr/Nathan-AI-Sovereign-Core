CREATE TABLE IF NOT EXISTS daily_scores (
  day TEXT NOT NULL,
  player TEXT NOT NULL,
  alias TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 3),
  ticks INTEGER NOT NULL CHECK (ticks BETWEEN 1 AND 28800),
  posted_at INTEGER NOT NULL,
  PRIMARY KEY (day, player)
);
CREATE INDEX IF NOT EXISTS daily_rank ON daily_scores(day, grade DESC, ticks ASC, posted_at ASC, player ASC);

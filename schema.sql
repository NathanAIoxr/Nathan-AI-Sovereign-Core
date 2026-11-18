CREATE TABLE IF NOT EXISTS cockpit_log (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 tier TEXT NOT NULL,
 action TEXT NOT NULL,
 state INTEGER NOT NULL DEFAULT 1,
 payload TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cockpit_created ON cockpit_log(created_at DESC);

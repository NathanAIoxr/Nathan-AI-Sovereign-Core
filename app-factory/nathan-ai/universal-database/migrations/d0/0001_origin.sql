CREATE TABLE IF NOT EXISTS sovereign_root (
  box_id TEXT PRIMARY KEY CHECK (box_id = 'D0'),
  title TEXT NOT NULL,
  parent_seed TEXT CHECK (parent_seed IS NULL)
);
INSERT OR IGNORE INTO sovereign_root VALUES ('D0', 'The Void / Origin', NULL);

CREATE TABLE IF NOT EXISTS root_route (
  box_id TEXT PRIMARY KEY,
  binding_name TEXT NOT NULL UNIQUE
);
INSERT OR IGNORE INTO root_route VALUES ('D0', 'DB_D0'), ('D1', 'DB_D1');

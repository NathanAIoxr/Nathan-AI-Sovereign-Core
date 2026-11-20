CREATE TABLE IF NOT EXISTS entries (
  workspace TEXT NOT NULL,
  id TEXT NOT NULL,
  content TEXT NOT NULL CHECK(json_valid(content)),
  revision INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(workspace,id)
);
CREATE INDEX IF NOT EXISTS entries_public ON entries(published,updated_at DESC);
CREATE TABLE IF NOT EXISTS recordings (
  workspace TEXT NOT NULL,
  id TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(workspace,id)
);
CREATE TABLE IF NOT EXISTS indexing (
  workspace TEXT NOT NULL,
  id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  catalog TEXT NOT NULL,
  phonetics TEXT NOT NULL,
  evidence TEXT NOT NULL,
  PRIMARY KEY(workspace,id),
  FOREIGN KEY(workspace,id) REFERENCES entries(workspace,id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS publication_assets (
  path TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_receipt (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tick INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_lease (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner TEXT NOT NULL,
  expires INTEGER NOT NULL
);

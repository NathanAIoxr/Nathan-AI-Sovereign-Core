CREATE TABLE IF NOT EXISTS owned_runtime_registry (
  record_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('worker', 'bot', 'agent')),
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  source_ref TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL CHECK (state IN ('declared', 'observed', 'missing')),
  provenance TEXT NOT NULL CHECK (provenance IN ('owner', 'cloudflare-account', 'github-source')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(record_key) BETWEEN 1 AND 200),
  CHECK (length(title) BETWEEN 1 AND 128),
  CHECK (length(location) <= 160 AND length(source_ref) <= 400),
  CHECK (provenance = 'cloudflare-account' OR state = 'declared')
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_owned_runtime_kind_key ON owned_runtime_registry (kind, record_key);
CREATE INDEX IF NOT EXISTS idx_owned_runtime_state_key ON owned_runtime_registry (state, record_key);

CREATE TABLE IF NOT EXISTS owned_runtime_counts (
  kind TEXT NOT NULL,
  state TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  PRIMARY KEY (kind, state)
) WITHOUT ROWID;

INSERT OR IGNORE INTO owned_runtime_counts
  SELECT kind, state, count(*) FROM owned_runtime_registry GROUP BY kind, state;

CREATE TRIGGER IF NOT EXISTS owned_runtime_count_insert
AFTER INSERT ON owned_runtime_registry BEGIN
  INSERT INTO owned_runtime_counts VALUES (NEW.kind, NEW.state, 1)
  ON CONFLICT(kind, state) DO UPDATE SET total = total + 1;
END;

CREATE TRIGGER IF NOT EXISTS owned_runtime_count_state
AFTER UPDATE OF kind, state ON owned_runtime_registry
WHEN OLD.kind <> NEW.kind OR OLD.state <> NEW.state BEGIN
  UPDATE owned_runtime_counts SET total = total - 1 WHERE kind = OLD.kind AND state = OLD.state;
  INSERT INTO owned_runtime_counts VALUES (NEW.kind, NEW.state, 1)
  ON CONFLICT(kind, state) DO UPDATE SET total = total + 1;
END;

CREATE TRIGGER IF NOT EXISTS owned_runtime_count_delete
AFTER DELETE ON owned_runtime_registry BEGIN
  UPDATE owned_runtime_counts SET total = total - 1 WHERE kind = OLD.kind AND state = OLD.state;
END;

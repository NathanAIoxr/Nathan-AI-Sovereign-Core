CREATE TABLE IF NOT EXISTS arcade_events (
  code TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  expires_ms INTEGER NOT NULL,
  body TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS arcade_events_expiry ON arcade_events(expires_ms);

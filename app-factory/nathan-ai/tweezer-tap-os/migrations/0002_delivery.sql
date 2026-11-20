CREATE TABLE received_events (
    event_id TEXT PRIMARY KEY REFERENCES events(event_id),
    received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

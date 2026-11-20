CREATE TABLE event_seals (
    event_id TEXT PRIMARY KEY REFERENCES events(event_id),
    sequence INTEGER UNIQUE NOT NULL,
    previous_hash TEXT NOT NULL,
    alien_hash TEXT NOT NULL,
    neila_hash TEXT NOT NULL,
    merkle_root TEXT UNIQUE NOT NULL
);
CREATE TABLE audit_seals (
    run_id TEXT NOT NULL REFERENCES zone_runs(run_id),
    direction TEXT NOT NULL,
    check_name TEXT NOT NULL,
    hash TEXT NOT NULL,
    PRIMARY KEY (run_id, direction, check_name)
);
CREATE TABLE emit_webhook_receipts (
    event_id TEXT PRIMARY KEY REFERENCES received_events(event_id),
    delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

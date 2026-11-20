-- D1 migration for zone/tweezer-tap-os. Seed data is fictional.
-- The ledger models game simulation and staging verification.
-- events.event_id is the stable idempotency key for retries.
-- Atomically insert events and outbox rows with D1 batch().
-- After publication, write emit_receipts. A send followed by a crash can be
-- replayed, so each consumer must deduplicate by event_id before acting.
-- Store only bounded, validated game and build metadata.

CREATE TABLE cartridges (
    cartridge_id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE TABLE tap_decks (
    deck_id TEXT PRIMARY KEY NOT NULL,
    cartridge_id TEXT NOT NULL REFERENCES cartridges(cartridge_id),
    title TEXT NOT NULL
);

CREATE TABLE tap_tiles (
    deck_id TEXT NOT NULL REFERENCES tap_decks(deck_id),
    tile_position INTEGER NOT NULL CHECK (tile_position BETWEEN 1 AND 12),
    trigger_name TEXT NOT NULL CHECK (
        trigger_name IN ('HOLD_HEAD', 'FLASHLIGHT_ON', 'TWEEZERS_PULL', 'RESET_SIM')
    ),
    label TEXT NOT NULL,
    PRIMARY KEY (deck_id, tile_position),
    UNIQUE (deck_id, trigger_name)
);

CREATE TABLE zone_runs (
    run_id TEXT PRIMARY KEY NOT NULL,
    zone_id TEXT NOT NULL CHECK (zone_id = 'zone/tweezer-tap-os'),
    revision TEXT NOT NULL CHECK (length(revision) BETWEEN 1 AND 128),
    started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE events (
    event_id TEXT PRIMARY KEY NOT NULL CHECK (length(event_id) BETWEEN 1 AND 128),
    event_type TEXT NOT NULL CHECK (event_type IN ('TIME_TICK', 'TAP_SIM')),
    tick_slot INTEGER,
    run_id TEXT REFERENCES zone_runs(run_id),
    deck_id TEXT,
    trigger_name TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (deck_id, trigger_name) REFERENCES tap_tiles(deck_id, trigger_name),
    CHECK (
        (event_type = 'TIME_TICK' AND tick_slot IS NOT NULL AND tick_slot >= 0
            AND run_id IS NULL AND deck_id IS NULL AND trigger_name IS NULL)
        OR
        (event_type = 'TAP_SIM' AND tick_slot IS NULL
            AND run_id IS NOT NULL AND deck_id IS NOT NULL AND trigger_name IS NOT NULL)
    )
);
-- TIME producers must agree on a UTC slot duration and derive the same slot
-- from the scheduled instant, including when an alarm or cron call retries.
CREATE UNIQUE INDEX one_time_event_per_slot ON events(tick_slot)
    WHERE event_type = 'TIME_TICK';
CREATE INDEX events_by_run ON events(run_id, created_at);

CREATE TABLE extraction_log (
    event_id TEXT PRIMARY KEY NOT NULL REFERENCES events(event_id),
    result TEXT NOT NULL CHECK (result IN ('SIMULATED', 'BLOCKED', 'RESET')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TRIGGER extraction_requires_tap
BEFORE INSERT ON extraction_log
WHEN NOT EXISTS (
    SELECT 1 FROM events WHERE event_id = NEW.event_id AND event_type = 'TAP_SIM'
)
BEGIN
    SELECT RAISE(ABORT, 'extraction log requires a simulated tap');
END;

CREATE TABLE audit_checks (
    run_id TEXT NOT NULL REFERENCES zone_runs(run_id),
    direction TEXT NOT NULL CHECK (direction IN ('ALIEN_FORWARD', 'NEILA_REVERSE')),
    check_name TEXT NOT NULL CHECK (check_name IN ('schema', 'smoke', 'manifest')),
    outcome TEXT NOT NULL CHECK (outcome IN ('PASS', 'FAIL')),
    evidence_ref TEXT NOT NULL CHECK (length(trim(evidence_ref)) BETWEEN 1 AND 256),
    checked_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (run_id, direction, check_name)
);

-- The Worker must verify evidence against the same revision and write the
-- corresponding check only after execution. The view establishes completeness,
-- not authority to merge or deploy. A rerun uses a fresh run_id.
CREATE TRIGGER reverse_requires_forward_pass
BEFORE INSERT ON audit_checks
WHEN NEW.direction = 'NEILA_REVERSE' AND (
    SELECT count(*) FROM audit_checks
    WHERE run_id = NEW.run_id AND direction = 'ALIEN_FORWARD' AND outcome = 'PASS'
) <> 3
BEGIN
    SELECT RAISE(ABORT, 'finish all forward checks before reverse verification');
END;

CREATE VIEW zone_verification AS
SELECT r.run_id, r.zone_id, r.revision,
    CASE
        WHEN sum(CASE WHEN a.outcome = 'FAIL' THEN 1 ELSE 0 END) > 0 THEN 'FAIL'
        WHEN sum(CASE WHEN a.outcome = 'PASS' THEN 1 ELSE 0 END) = 6 THEN 'PASS'
        ELSE 'PENDING'
    END AS integrity
FROM zone_runs AS r
LEFT JOIN audit_checks AS a ON a.run_id = r.run_id
GROUP BY r.run_id, r.zone_id, r.revision;

CREATE TABLE emit_outbox (
    event_id TEXT PRIMARY KEY NOT NULL REFERENCES events(event_id),
    enqueued_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE emit_receipts (
    event_id TEXT PRIMARY KEY NOT NULL REFERENCES emit_outbox(event_id),
    published_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE VIEW pending_emits AS
SELECT e.*, o.enqueued_at
FROM emit_outbox AS o
JOIN events AS e ON e.event_id = o.event_id
LEFT JOIN emit_receipts AS r ON r.event_id = o.event_id
WHERE r.event_id IS NULL;

-- Application-level append-only protection. Database administrators can
-- change schema and backups, so these guards are not tamper-proof storage.
CREATE TRIGGER zone_runs_reject_duplicate
BEFORE INSERT ON zone_runs
WHEN EXISTS (SELECT 1 FROM zone_runs AS existing WHERE existing.run_id = NEW.run_id)
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM zone_runs WHERE run_id = NEW.run_id
            AND (zone_id IS NOT NEW.zone_id OR revision IS NOT NEW.revision)
    ) THEN RAISE(ABORT, 'run identity conflict') END;
    SELECT RAISE(IGNORE);
END;
CREATE TRIGGER zone_runs_no_update
BEFORE UPDATE ON zone_runs
BEGIN
    SELECT RAISE(ABORT, 'zone_runs is append-only');
END;
CREATE TRIGGER zone_runs_no_delete
BEFORE DELETE ON zone_runs
BEGIN
    SELECT RAISE(ABORT, 'zone_runs is append-only');
END;
CREATE TRIGGER events_reject_duplicate
BEFORE INSERT ON events
WHEN EXISTS (SELECT 1 FROM events AS existing WHERE existing.event_id = NEW.event_id OR (NEW.event_type = 'TIME_TICK' AND existing.tick_slot = NEW.tick_slot))
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM events AS e
        WHERE (e.event_id = NEW.event_id OR
            (NEW.event_type = 'TIME_TICK' AND e.tick_slot = NEW.tick_slot))
            AND (e.event_id IS NOT NEW.event_id OR e.event_type IS NOT NEW.event_type
                OR e.tick_slot IS NOT NEW.tick_slot OR e.run_id IS NOT NEW.run_id
                OR e.deck_id IS NOT NEW.deck_id OR e.trigger_name IS NOT NEW.trigger_name)
    ) THEN RAISE(ABORT, 'event identity conflict') END;
    SELECT RAISE(IGNORE);
END;
CREATE TRIGGER events_no_update
BEFORE UPDATE ON events
BEGIN
    SELECT RAISE(ABORT, 'events is append-only');
END;
CREATE TRIGGER events_no_delete
BEFORE DELETE ON events
BEGIN
    SELECT RAISE(ABORT, 'events is append-only');
END;
CREATE TRIGGER extraction_log_reject_duplicate
BEFORE INSERT ON extraction_log
WHEN EXISTS (SELECT 1 FROM extraction_log AS existing WHERE existing.event_id = NEW.event_id)
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM extraction_log WHERE event_id = NEW.event_id AND result IS NOT NEW.result
    ) THEN RAISE(ABORT, 'extraction_log replay conflict') END;
    SELECT RAISE(IGNORE);
END;
CREATE TRIGGER extraction_log_no_update
BEFORE UPDATE ON extraction_log
BEGIN
    SELECT RAISE(ABORT, 'extraction_log is append-only');
END;
CREATE TRIGGER extraction_log_no_delete
BEFORE DELETE ON extraction_log
BEGIN
    SELECT RAISE(ABORT, 'extraction_log is append-only');
END;
CREATE TRIGGER audit_checks_reject_duplicate
BEFORE INSERT ON audit_checks
WHEN EXISTS (SELECT 1 FROM audit_checks AS existing WHERE existing.run_id = NEW.run_id AND existing.direction = NEW.direction AND existing.check_name = NEW.check_name)
BEGIN
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM audit_checks WHERE run_id = NEW.run_id AND direction = NEW.direction AND check_name = NEW.check_name AND (outcome IS NOT NEW.outcome OR evidence_ref IS NOT NEW.evidence_ref)
    ) THEN RAISE(ABORT, 'audit_checks replay conflict') END;
    SELECT RAISE(IGNORE);
END;
CREATE TRIGGER audit_checks_no_update
BEFORE UPDATE ON audit_checks
BEGIN
    SELECT RAISE(ABORT, 'audit_checks is append-only');
END;
CREATE TRIGGER audit_checks_no_delete
BEFORE DELETE ON audit_checks
BEGIN
    SELECT RAISE(ABORT, 'audit_checks is append-only');
END;
CREATE TRIGGER emit_outbox_reject_duplicate
BEFORE INSERT ON emit_outbox
WHEN EXISTS (SELECT 1 FROM emit_outbox AS existing WHERE existing.event_id = NEW.event_id)
BEGIN
    SELECT RAISE(IGNORE);
END;
CREATE TRIGGER emit_outbox_no_update
BEFORE UPDATE ON emit_outbox
BEGIN
    SELECT RAISE(ABORT, 'emit_outbox is append-only');
END;
CREATE TRIGGER emit_outbox_no_delete
BEFORE DELETE ON emit_outbox
BEGIN
    SELECT RAISE(ABORT, 'emit_outbox is append-only');
END;
CREATE TRIGGER emit_receipts_reject_duplicate
BEFORE INSERT ON emit_receipts
WHEN EXISTS (SELECT 1 FROM emit_receipts AS existing WHERE existing.event_id = NEW.event_id)
BEGIN
    SELECT RAISE(IGNORE);
END;
CREATE TRIGGER emit_receipts_no_update
BEFORE UPDATE ON emit_receipts
BEGIN
    SELECT RAISE(ABORT, 'emit_receipts is append-only');
END;
CREATE TRIGGER emit_receipts_no_delete
BEFORE DELETE ON emit_receipts
BEGIN
    SELECT RAISE(ABORT, 'emit_receipts is append-only');
END;

INSERT INTO cartridges (cartridge_id, title) VALUES
    ('nostril_toy', 'Nostril Toy'),
    ('shoulder_bb', 'Shoulder BB'),
    ('ingrown_nail', 'Ingrown Nail');

INSERT INTO tap_decks (deck_id, cartridge_id, title)
SELECT cartridge_id, cartridge_id, title FROM cartridges;

INSERT INTO tap_tiles (deck_id, tile_position, trigger_name, label)
SELECT d.deck_id, t.tile_position, t.trigger_name, t.label
FROM tap_decks AS d
CROSS JOIN (
    SELECT 1 AS tile_position, 'HOLD_HEAD' AS trigger_name, 'Hold' AS label
    UNION ALL SELECT 2, 'FLASHLIGHT_ON', 'Flashlight'
    UNION ALL SELECT 3, 'TWEEZERS_PULL', 'Pull'
    UNION ALL SELECT 4, 'RESET_SIM', 'Reset'
) AS t;

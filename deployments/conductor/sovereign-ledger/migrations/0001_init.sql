-- Nathan AI Sovereign Ledger: append-only, hash-chained provenance table.
-- Single source of truth: used by D1 (wrangler d1 migrations) AND local SQLite (python/ledger.py).
-- Rows written per insert (estimate, verify with meta.rows_written): 1 table row + 4 index rows.

CREATE TABLE artifact_scroll_ledger (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_type         TEXT    NOT NULL DEFAULT 'record'
                       CHECK (entry_type IN ('record', 'correction')),
    ref_client_sha256  TEXT    REFERENCES artifact_scroll_ledger(client_sha256),
    format_anchor      TEXT    NOT NULL
                       CHECK (format_anchor = 'AA55FF01312B313D327E312D313D300400F0'),
    scroll_siglum      TEXT    NOT NULL CHECK (length(scroll_siglum) BETWEEN 1 AND 64),
    cave_or_site       TEXT    NOT NULL CHECK (length(cave_or_site) BETWEEN 1 AND 128),
    medium             TEXT    NOT NULL
                       CHECK (medium IN ('parchment', 'papyrus', 'copper', 'stone', 'other')),
    script_lang        TEXT    NOT NULL
                       CHECK (script_lang IN ('Hebrew', 'Aramaic', 'Greek', 'Paleo-Hebrew', 'other')),
    epigraphic_status  TEXT    NOT NULL
                       CHECK (epigraphic_status IN ('extant_verified', 'reconstructed')),
    unix_timestamp     INTEGER NOT NULL CHECK (unix_timestamp > 0),
    iso_timestamp      TEXT    NOT NULL,
    content_nfc        TEXT    NOT NULL,
    media_asset_sha256 TEXT    CHECK (media_asset_sha256 IS NULL OR length(media_asset_sha256) = 64),
    client_sha256      TEXT    NOT NULL UNIQUE CHECK (length(client_sha256) = 64),
    payload_sha256     TEXT    NOT NULL UNIQUE CHECK (length(payload_sha256) = 64),
    prev_chain_sha256  TEXT    NOT NULL UNIQUE CHECK (length(prev_chain_sha256) = 64),
    CHECK (
        (entry_type = 'record'     AND ref_client_sha256 IS NULL) OR
        (entry_type = 'correction' AND ref_client_sha256 IS NOT NULL)
    )
);

-- UNIQUE(prev_chain_sha256): a parent can have exactly one child, so the chain cannot fork.
-- UNIQUE(client_sha256): ingest is idempotent; a replayed record is rejected, not duplicated.

CREATE INDEX idx_ledger_siglum ON artifact_scroll_ledger(scroll_siglum);

CREATE TRIGGER ledger_no_update BEFORE UPDATE ON artifact_scroll_ledger
BEGIN
    SELECT RAISE(ABORT, 'ledger is append-only: UPDATE forbidden, append a correction instead');
END;

CREATE TRIGGER ledger_no_delete BEFORE DELETE ON artifact_scroll_ledger
BEGIN
    SELECT RAISE(ABORT, 'ledger is append-only: DELETE forbidden, append a correction instead');
END;

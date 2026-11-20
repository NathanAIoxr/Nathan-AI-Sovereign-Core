CREATE TABLE IF NOT EXISTS artifact_scroll_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anchor_hex TEXT NOT NULL CHECK (anchor_hex = 'AA55FF01312B313D327E312D313D300400F0'),
  scroll_siglum TEXT NOT NULL,
  cave_or_site TEXT NOT NULL,
  medium TEXT NOT NULL,
  script_lang TEXT NOT NULL,
  epigraphic_status TEXT NOT NULL CHECK (epigraphic_status IN ('extant_verified', 'reconstructed')),
  unix_timestamp INTEGER NOT NULL,
  iso_timestamp TEXT NOT NULL,
  content_nfc TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL UNIQUE,
  prev_chain_sha256 TEXT NOT NULL,
  media_asset_sha256 TEXT,
  fingerprint_sha256 TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_scroll_siglum ON artifact_scroll_ledger(scroll_siglum);
CREATE INDEX IF NOT EXISTS idx_unix_timestamp ON artifact_scroll_ledger(unix_timestamp);

CREATE TRIGGER IF NOT EXISTS artifact_scroll_chain_tail
BEFORE INSERT ON artifact_scroll_ledger
WHEN NEW.prev_chain_sha256 <> COALESCE(
  (SELECT payload_sha256 FROM artifact_scroll_ledger ORDER BY id DESC LIMIT 1),
  '0000000000000000000000000000000000000000000000000000000000000000'
)
BEGIN
  SELECT RAISE(ABORT, 'artifact_scroll_stale_head');
END;

CREATE TRIGGER IF NOT EXISTS artifact_scroll_no_update
BEFORE UPDATE ON artifact_scroll_ledger BEGIN
  SELECT RAISE(ABORT, 'artifact_scroll_append_only');
END;

CREATE TRIGGER IF NOT EXISTS artifact_scroll_no_delete
BEFORE DELETE ON artifact_scroll_ledger BEGIN
  SELECT RAISE(ABORT, 'artifact_scroll_append_only');
END;

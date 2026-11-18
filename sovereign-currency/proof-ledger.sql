CREATE TABLE IF NOT EXISTS sovereign_header_receipts (
  sequence INTEGER PRIMARY KEY,
  receipt_id TEXT NOT NULL UNIQUE CHECK (length(receipt_id) = 64),
  header_hex TEXT NOT NULL UNIQUE CHECK (length(header_hex) = 160),
  block_hash TEXT NOT NULL CHECK (length(block_hash) = 64),
  recorded_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS sovereign_header_receipts_no_update
BEFORE UPDATE ON sovereign_header_receipts BEGIN
  SELECT RAISE(ABORT, 'header proof receipts are append-only');
END;

CREATE TRIGGER IF NOT EXISTS sovereign_header_receipts_no_delete
BEFORE DELETE ON sovereign_header_receipts BEGIN
  SELECT RAISE(ABORT, 'header proof receipts are append-only');
END;

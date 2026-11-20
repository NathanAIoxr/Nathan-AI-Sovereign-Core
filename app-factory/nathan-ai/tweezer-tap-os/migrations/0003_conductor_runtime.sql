CREATE TABLE IF NOT EXISTS zone_warrant (
  zone_id TEXT PRIMARY KEY CHECK (zone_id = 'tweezer-tap-os'),
  mode TEXT NOT NULL CHECK (mode = 'HOLDING'),
  enabled INTEGER NOT NULL CHECK (enabled IN (0,1)),
  expires_at INTEGER
);
INSERT OR IGNORE INTO zone_warrant VALUES ('tweezer-tap-os', 'HOLDING', 1, NULL);
CREATE TABLE IF NOT EXISTS conductor_evidence (
  event_id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL UNIQUE CHECK (sequence > 0),
  trigger_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  audit_status TEXT NOT NULL CHECK (audit_status IN ('PASS','BRAKE')),
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  prior_sha256 TEXT NOT NULL CHECK (length(prior_sha256) IN (0,64)),
  event_json TEXT NOT NULL CHECK (json_valid(event_json))
);
CREATE TRIGGER IF NOT EXISTS conductor_evidence_no_update
BEFORE UPDATE ON conductor_evidence BEGIN SELECT RAISE(ABORT, 'append-only ledger'); END;
CREATE TRIGGER IF NOT EXISTS conductor_evidence_no_delete
BEFORE DELETE ON conductor_evidence BEGIN SELECT RAISE(ABORT, 'append-only ledger'); END;
CREATE TABLE IF NOT EXISTS conductor_delivery_receipts (
  event_id TEXT PRIMARY KEY REFERENCES conductor_evidence(event_id),
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
  applied_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS conductor_webhook_receipts (
  event_id TEXT PRIMARY KEY REFERENCES conductor_evidence(event_id),
  applied_at INTEGER NOT NULL
);

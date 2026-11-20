CREATE TABLE IF NOT EXISTS node_template_receipts (
  source TEXT NOT NULL,
  node TEXT NOT NULL,
  event_id TEXT NOT NULL,
  digest TEXT NOT NULL CHECK(length(digest) = 64),
  operation TEXT NOT NULL,
  outcome TEXT NOT NULL,
  evidence TEXT NOT NULL CHECK(length(evidence) = 64),
  revision TEXT,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(source, node, event_id)
) STRICT, WITHOUT ROWID;

CREATE TRIGGER IF NOT EXISTS node_template_receipts_keep_update
BEFORE UPDATE ON node_template_receipts
BEGIN SELECT RAISE(ABORT, 'node template receipts are append-only'); END;

CREATE TRIGGER IF NOT EXISTS node_template_receipts_keep_delete
BEFORE DELETE ON node_template_receipts
BEGIN SELECT RAISE(ABORT, 'node template receipts are append-only'); END;

CREATE TABLE IF NOT EXISTS deterministic_ledger (
  tx_id TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal IN (0,1)),
  owner TEXT NOT NULL, payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  state TEXT NOT NULL CHECK(state IN ('INTENT_LOCKED','REJECTED','SETTLED_2','SETTLED_0','EXPIRED')),
  expires_at INTEGER NOT NULL, alien_seal TEXT NOT NULL CHECK(length(alien_seal)=64),
  neila_seal TEXT NOT NULL CHECK(length(neila_seal)=64),
  CHECK((ordinal=0 AND state IN ('INTENT_LOCKED','REJECTED')) OR (ordinal=1 AND state IN ('SETTLED_2','SETTLED_0','EXPIRED'))),
  PRIMARY KEY(tx_id,ordinal)
) STRICT;
CREATE INDEX IF NOT EXISTS deterministic_ledger_due ON deterministic_ledger(state,expires_at);
CREATE TABLE IF NOT EXISTS verification_quarantine (
  scope TEXT NOT NULL, record_id TEXT NOT NULL, detected_at TEXT NOT NULL,
  PRIMARY KEY(scope,record_id)
) STRICT;
CREATE TABLE IF NOT EXISTS dns_live_proofs (
  event_id TEXT PRIMARY KEY, domain TEXT NOT NULL, zone_id TEXT NOT NULL,
  approved_json TEXT NOT NULL CHECK(json_valid(approved_json)),
  activated_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS dns_live_proofs_scope ON dns_live_proofs(domain,zone_id,activated_at);

CREATE TRIGGER IF NOT EXISTS risk_no_update BEFORE UPDATE ON deterministic_ledger BEGIN SELECT RAISE(ABORT,'immutable_risk'); END;
CREATE TRIGGER IF NOT EXISTS risk_no_delete BEFORE DELETE ON deterministic_ledger BEGIN SELECT RAISE(ABORT,'immutable_risk'); END;
CREATE TRIGGER IF NOT EXISTS risk_no_replace BEFORE INSERT ON deterministic_ledger
WHEN EXISTS (SELECT 1 FROM deterministic_ledger WHERE tx_id=NEW.tx_id AND ordinal=NEW.ordinal)
BEGIN SELECT RAISE(ABORT,'immutable_risk'); END;

CREATE TRIGGER IF NOT EXISTS voice_no_update BEFORE UPDATE ON voice_vault BEGIN SELECT RAISE(ABORT,'immutable_voice'); END;
CREATE TRIGGER IF NOT EXISTS voice_no_delete BEFORE DELETE ON voice_vault BEGIN SELECT RAISE(ABORT,'immutable_voice'); END;
CREATE TRIGGER IF NOT EXISTS voice_no_replace BEFORE INSERT ON voice_vault
WHEN EXISTS (SELECT 1 FROM voice_vault WHERE event_id=NEW.event_id)
BEGIN SELECT RAISE(ABORT,'immutable_voice'); END;

CREATE TRIGGER IF NOT EXISTS seal_no_update BEFORE UPDATE ON provenance_ledger BEGIN SELECT RAISE(ABORT,'immutable_provenance'); END;
CREATE TRIGGER IF NOT EXISTS seal_no_delete BEFORE DELETE ON provenance_ledger BEGIN SELECT RAISE(ABORT,'immutable_provenance'); END;
CREATE TRIGGER IF NOT EXISTS seal_no_replace BEFORE INSERT ON provenance_ledger
WHEN EXISTS (SELECT 1 FROM provenance_ledger WHERE event_id=NEW.event_id OR alien_hash=NEW.alien_hash)
BEGIN SELECT RAISE(ABORT,'immutable_provenance'); END;

CREATE TRIGGER IF NOT EXISTS dns_proof_no_update BEFORE UPDATE ON dns_live_proofs BEGIN SELECT RAISE(ABORT,'immutable_dns_proof'); END;
CREATE TRIGGER IF NOT EXISTS dns_proof_no_delete BEFORE DELETE ON dns_live_proofs BEGIN SELECT RAISE(ABORT,'immutable_dns_proof'); END;
CREATE TRIGGER IF NOT EXISTS dns_proof_no_replace BEFORE INSERT ON dns_live_proofs
WHEN EXISTS (SELECT 1 FROM dns_live_proofs WHERE event_id=NEW.event_id)
BEGIN SELECT RAISE(ABORT,'immutable_dns_proof'); END;

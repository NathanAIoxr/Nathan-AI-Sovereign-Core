CREATE TABLE IF NOT EXISTS dns_provision_receipts (
  domain TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL UNIQUE,
  cf_status TEXT NOT NULL,
  nameservers_json TEXT NOT NULL CHECK (json_valid(nameservers_json)),
  route_id TEXT,
  gate_mode TEXT NOT NULL CHECK (gate_mode IN ('HOLDING','LIVE')),
  alien_seal TEXT NOT NULL CHECK (length(alien_seal)=64),
  neila_seal TEXT NOT NULL CHECK (length(neila_seal)=64),
  checked_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_dns_provision_checked ON dns_provision_receipts(checked_at,domain);

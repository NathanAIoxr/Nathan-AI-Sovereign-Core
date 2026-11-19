-- ADDITIVE DESIGN MIGRATION ONLY: do not run on production without schema review.
-- Never alter existing tenant/order tables blindly. New tables provide safe integration contracts.
CREATE TABLE IF NOT EXISTS pp_tenant_settings (
 tenant_id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL,
 iana_timezone TEXT NOT NULL DEFAULT 'America/New_York',
 quiet_start_local TEXT NOT NULL DEFAULT '21:00',
 quiet_end_local TEXT NOT NULL DEFAULT '07:00',
 onboarding_state TEXT NOT NULL DEFAULT 'PENDING',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pp_tenant_admins (
 tenant_id TEXT NOT NULL, user_id TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('OWNER','ADMIN')),
 verified_at TEXT, PRIMARY KEY(tenant_id,user_id)
);
-- Enforce two verified administrators at activation in a transaction.
CREATE TABLE IF NOT EXISTS pp_event_inbox (
 provider TEXT NOT NULL, event_id TEXT NOT NULL,
 tenant_id TEXT NOT NULL, received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 processed_at TEXT, state TEXT NOT NULL DEFAULT 'RECEIVED',
 PRIMARY KEY(provider,event_id)
);
CREATE TABLE IF NOT EXISTS pp_financial_ledger (
 entry_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
 source_type TEXT NOT NULL, source_id TEXT NOT NULL,
 account_code TEXT NOT NULL, amount_cents INTEGER NOT NULL,
 currency TEXT NOT NULL DEFAULT 'USD',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(tenant_id,source_type,source_id,account_code)
);
CREATE TABLE IF NOT EXISTS pp_offline_operations (
 tenant_id TEXT NOT NULL, operation_id TEXT NOT NULL,
 device_id TEXT NOT NULL, operation_type TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'RECEIVED',
 payload_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,operation_id)
);
CREATE TABLE IF NOT EXISTS pp_delivery_readiness (
 delivery_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
 liftgate_required INTEGER NOT NULL DEFAULT 0,
 unloading_equipment_confirmed INTEGER NOT NULL DEFAULT 0,
 crew_required INTEGER NOT NULL DEFAULT 0,
 crew_confirmed INTEGER NOT NULL DEFAULT 0,
 verified_at TEXT, pre_unload_photo_key TEXT, post_unload_photo_key TEXT,
 weather_hold_status TEXT NOT NULL DEFAULT 'NONE'
);
CREATE TABLE IF NOT EXISTS pp_receipt_records (
 receipt_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
 transaction_kind TEXT NOT NULL CHECK(transaction_kind IN ('PRODUCT_SALE','DONATION')),
 source_id TEXT NOT NULL, total_cents INTEGER NOT NULL,
 fair_market_value_cents INTEGER,
 contribution_eligible_cents INTEGER,
 receipt_status TEXT NOT NULL DEFAULT 'PENDING',
 UNIQUE(tenant_id,transaction_kind,source_id)
);
CREATE INDEX IF NOT EXISTS pp_ledger_tenant_date ON pp_financial_ledger(tenant_id,created_at);

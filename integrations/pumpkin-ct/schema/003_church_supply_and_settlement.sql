-- ADDITIVE D1 MIGRATION DRAFT. Do not apply without target DB review.
CREATE TABLE IF NOT EXISTS pp_church_accounts (
 church_id TEXT PRIMARY KEY, display_name TEXT NOT NULL, external_ref TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pp_catalog_products (
 sku TEXT PRIMARY KEY, name TEXT NOT NULL, track TEXT NOT NULL, season TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1))
);
CREATE TABLE IF NOT EXISTS pp_tier_schedules (
 track TEXT NOT NULL, tier INTEGER NOT NULL, threshold_cents INTEGER NOT NULL,
 cash_rate TEXT, credit_bonus_rate TEXT, money_off_rate TEXT, sponsor_rebate_rate TEXT,
 approved INTEGER NOT NULL DEFAULT 0 CHECK(approved IN (0,1)),
 PRIMARY KEY(track,tier)
);
CREATE TABLE IF NOT EXISTS pp_fundraising_campaigns (
 campaign_id TEXT PRIMARY KEY, church_id TEXT NOT NULL REFERENCES pp_church_accounts(church_id),
 track TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT'
);
CREATE TABLE IF NOT EXISTS pp_orders (
 order_id TEXT PRIMARY KEY, campaign_id TEXT REFERENCES pp_fundraising_campaigns(campaign_id),
 church_id TEXT NOT NULL REFERENCES pp_church_accounts(church_id),
 gross_cents INTEGER NOT NULL CHECK(gross_cents>=0), status TEXT NOT NULL DEFAULT 'DRAFT'
);
CREATE TABLE IF NOT EXISTS pp_supply_wallet_ledger (
 ledger_id TEXT PRIMARY KEY, church_id TEXT NOT NULL REFERENCES pp_church_accounts(church_id),
 amount_cents INTEGER NOT NULL, reason TEXT NOT NULL, order_id TEXT REFERENCES pp_orders(order_id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pp_driver_invoices (
 invoice_id TEXT PRIMARY KEY, church_id TEXT NOT NULL REFERENCES pp_church_accounts(church_id),
 delivery_ref TEXT, amount_cents INTEGER NOT NULL CHECK(amount_cents>=0), status TEXT NOT NULL DEFAULT 'DRAFT'
);
CREATE TABLE IF NOT EXISTS pp_golden_ticket_promotions (
 promotion_id TEXT PRIMARY KEY, campaign_id TEXT REFERENCES pp_fundraising_campaigns(campaign_id),
 description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT'
);
CREATE TABLE IF NOT EXISTS pp_white_label_app_requests (
 request_id TEXT PRIMARY KEY, church_id TEXT NOT NULL REFERENCES pp_church_accounts(church_id),
 source_app TEXT NOT NULL, proposed_brand TEXT, status TEXT NOT NULL DEFAULT 'UNDECIDED'
);

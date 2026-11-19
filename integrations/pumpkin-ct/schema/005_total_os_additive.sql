-- Additive D1 proposal, NOT applied. Monetary values are integer cents.
-- Apply via reviewed Wrangler migration; do not migrate per request.
CREATE TABLE IF NOT EXISTS pp_total_donations (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 donation_id TEXT NOT NULL,
 donor_ref TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 fee_cents INTEGER NOT NULL DEFAULT 0 CHECK(fee_cents>=0),
 frequency TEXT NOT NULL CHECK(frequency IN ('ONE_TIME','MONTHLY')),
 channel TEXT NOT NULL, payment_status TEXT NOT NULL DEFAULT 'PENDING',
 tax_receipt_key TEXT, provider_payment_id TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,donation_id), UNIQUE(tenant_id,provider_payment_id)
);
CREATE TABLE IF NOT EXISTS pp_total_orders (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 order_id TEXT NOT NULL, track_key TEXT NOT NULL,
 buyer_type TEXT NOT NULL, gross_cents INTEGER NOT NULL CHECK(gross_cents>=0),
 benefit_cents INTEGER NOT NULL DEFAULT 0 CHECK(benefit_cents>=0),
 payout_mode TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT',
 fulfillment_ref TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,order_id)
);
CREATE TABLE IF NOT EXISTS pp_total_deliveries (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 delivery_id TEXT NOT NULL, carrier_id TEXT NOT NULL,
 ranked_slots_json TEXT NOT NULL, sla_deadline_utc TEXT,
 confirmed_slot TEXT, status TEXT NOT NULL DEFAULT 'PENDING_CARRIER',
 gps_photo_key TEXT, damage_credit_cents INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,delivery_id)
);
CREATE TABLE IF NOT EXISTS pp_total_streams (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 stream_id TEXT NOT NULL, title TEXT NOT NULL,
 cf_stream_uid TEXT, transcript_key TEXT,
 status TEXT NOT NULL DEFAULT 'DRAFT',
 PRIMARY KEY(tenant_id,stream_id)
);
CREATE TABLE IF NOT EXISTS pp_total_audit (
 audit_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL,
 actor_id TEXT NOT NULL, action TEXT NOT NULL,
 details_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS pp_total_donations_tenant_status ON pp_total_donations(tenant_id,payment_status);
CREATE INDEX IF NOT EXISTS pp_total_orders_tenant_status ON pp_total_orders(tenant_id,status);
CREATE INDEX IF NOT EXISTS pp_total_deliveries_tenant_status ON pp_total_deliveries(tenant_id,status);

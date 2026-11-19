-- Additive proposal; not applied. Tenant-scoped tables with composite foreign keys.
CREATE TABLE IF NOT EXISTS pp_tenants (
 tenant_id TEXT PRIMARY KEY, org_name TEXT NOT NULL, domain TEXT UNIQUE,
 brand_color TEXT, status TEXT NOT NULL DEFAULT 'DRAFT'
);
CREATE TABLE IF NOT EXISTS pp_tenant_modules (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 app_id TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 PRIMARY KEY(tenant_id,app_id)
);
CREATE TABLE IF NOT EXISTS pp_tenant_care_requests (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 request_id TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'OPEN',
 PRIMARY KEY(tenant_id,request_id)
);
CREATE TABLE IF NOT EXISTS pp_tenant_singles_profiles (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 profile_id TEXT NOT NULL, adult_verified INTEGER NOT NULL DEFAULT 0,
 display_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
 PRIMARY KEY(tenant_id,profile_id)
);
CREATE TABLE IF NOT EXISTS pp_tenant_wallets (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 wallet_id TEXT NOT NULL, balance_cents INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(tenant_id,wallet_id)
);
CREATE TABLE IF NOT EXISTS pp_tenant_app_events (
 tenant_id TEXT NOT NULL REFERENCES pp_tenants(tenant_id),
 event_id TEXT NOT NULL, app_id TEXT NOT NULL, event_type TEXT NOT NULL,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(tenant_id,event_id)
);

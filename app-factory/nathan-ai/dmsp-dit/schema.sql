-- Nathan Tabor DMSP + DIT. Additive, tenant-scoped schema.
CREATE TABLE IF NOT EXISTS dmsp_tenants (id TEXT PRIMARY KEY,name TEXT NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('DMSP','DIT','CO_MANAGED')),status TEXT NOT NULL DEFAULT 'ACTIVE',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS dmsp_departments (id TEXT PRIMARY KEY,title TEXT NOT NULL,scope TEXT NOT NULL,requires_human_review INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS dmsp_assets (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES dmsp_tenants(id),kind TEXT NOT NULL,name TEXT NOT NULL,provider TEXT,external_ref TEXT,health TEXT NOT NULL DEFAULT 'UNKNOWN',last_seen TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS dmsp_assets_tenant ON dmsp_assets(tenant_id,kind);
CREATE TABLE IF NOT EXISTS dmsp_tickets (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES dmsp_tenants(id),department_id TEXT NOT NULL REFERENCES dmsp_departments(id),title TEXT NOT NULL,severity TEXT NOT NULL CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),state TEXT NOT NULL DEFAULT 'OPEN' CHECK(state IN ('OPEN','TRIAGED','WAITING_APPROVAL','IN_PROGRESS','RESOLVED','CLOSED')),asset_id TEXT REFERENCES dmsp_assets(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS dmsp_tickets_tenant ON dmsp_tickets(tenant_id,state);
CREATE TABLE IF NOT EXISTS dmsp_runbooks (id TEXT PRIMARY KEY,department_id TEXT NOT NULL REFERENCES dmsp_departments(id),title TEXT NOT NULL,action_kind TEXT NOT NULL,approval_required INTEGER NOT NULL DEFAULT 1,enabled INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS dmsp_actions (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES dmsp_tenants(id),ticket_id TEXT REFERENCES dmsp_tickets(id),runbook_id TEXT NOT NULL REFERENCES dmsp_runbooks(id),requested_by TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','APPROVED','REJECTED','RUNNING','SUCCEEDED','FAILED')),approved_by TEXT,executed_at TEXT,receipt TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS dmsp_checks (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES dmsp_tenants(id),asset_id TEXT NOT NULL REFERENCES dmsp_assets(id),check_type TEXT NOT NULL,result TEXT NOT NULL CHECK(result IN ('PASS','WARN','FAIL','UNKNOWN')),observed_at TEXT NOT NULL,details TEXT);
CREATE INDEX IF NOT EXISTS dmsp_checks_asset ON dmsp_checks(asset_id,observed_at DESC);
CREATE TABLE IF NOT EXISTS dmsp_service_levels (id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES dmsp_tenants(id),severity TEXT NOT NULL,response_minutes INTEGER NOT NULL,resolution_target_minutes INTEGER,coverage TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS dmsp_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT,actor TEXT NOT NULL,action TEXT NOT NULL,resource TEXT,details TEXT,occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO dmsp_departments(id,title,scope,requires_human_review) VALUES
('helpdesk','Digital Help Desk','Tickets, user support, escalation',0),
('noc','Digital Network Operations','Uptime, capacity, infrastructure health',0),
('soc','Digital Security Operations','Threat triage and incident response',1),
('cloud','Cloud Operations','Workers, D1, Queues, Pages, DNS, cloud apps',1),
('endpoint','Endpoint Management','Devices, patch compliance, inventory',1),
('identity','Identity and Access','Provisioning, access reviews, MFA',1),
('recovery','Backup and Recovery','Backup checks and restore drills',1),
('devops','DevOps and Automation','CI/CD, deployments, runbooks',1),
('compliance','Compliance and Risk','Evidence, policies, audit trails',1),
('cio','Digital CIO / CTO','Roadmaps, budgets, architecture',1),
('success','Client Success','Service reports, communication, SLAs',0),
('finance','Finance and Operations','Contracts, subscriptions, costs',1);

-- Extended operating departments (additive; first DMSP/DIT public launch)
INSERT OR IGNORE INTO dmsp_departments(id,title,scope,requires_human_review) VALUES
('asset','Asset and Software Lifecycle','CMDB, software entitlements, warranty and license governance',0),
('network','Network Engineering','Authorized DNS, routing, Wi-Fi and network configuration',1),
('apps','Business Applications','SaaS configuration, integration and user enablement',1),
('data','Data and Analytics','Data governance, retention and reporting',1),
('observability','Observability and SRE','SLIs, SLOs, telemetry and alert quality',0),
('integration','Integration Engineering','APIs, webhooks and event connectors',1),
('platform','Platform Engineering','Internal developer platform and cloud infrastructure',1),
('knowledge','Knowledge and Training','Runbooks, knowledge articles and learning',0),
('onboarding','Onboarding and Offboarding','Client and staff joiner/mover/leaver processes',1),
('vendor','Vendor Management','Supplier due diligence, third-party risk and contracts',1),
('procurement','Procurement','Hardware, licensing, purchasing and inventory reconciliation',1),
('automation','Automation Verification','Approved runbooks, rollback and verification receipts',1),
('incident','Major Incident Command','Incident escalation, coordination and postmortems',1),
('privacy','Privacy and Data Protection','Data access minimization, retention and deletion',1),
('qa','Quality and Release Assurance','Pre-release tests, change validation and quality gates',1),
('field','Field Services','Authorized onsite support and equipment logistics',1);

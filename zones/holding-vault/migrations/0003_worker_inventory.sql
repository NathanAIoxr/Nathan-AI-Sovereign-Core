CREATE TABLE IF NOT EXISTS holding_worker_inventory_v1 (
 worker_name TEXT PRIMARY KEY,
 record_type TEXT NOT NULL DEFAULT 'deployed_script',
 launch_policy TEXT NOT NULL DEFAULT 'PRESERVE_EXISTING',
 observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Populate from the authorized Cloudflare Workers Scripts API during deployment audit.
-- Do not confuse inventory registration with a Worker code deployment.

CREATE TABLE IF NOT EXISTS cloud_worker_inventory (
  worker_id TEXT PRIMARY KEY,
  recorded_at TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS cloud_slayer_modules (
  module_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active INTEGER NOT NULL CHECK (active IN (0, 1))
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS cloud_slayer_module_views (
  module_id TEXT NOT NULL REFERENCES cloud_slayer_modules(module_id),
  view_name TEXT NOT NULL CHECK (view_name IN ('supercomputer', 'hypercomputer', 'sos')),
  PRIMARY KEY (view_name, module_id)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS cloud_slayer_snapshot (
  source TEXT PRIMARY KEY,
  recorded_at TEXT NOT NULL
) WITHOUT ROWID;

INSERT OR IGNORE INTO cloud_slayer_modules VALUES
  ('inventory-summary', 'Worker inventory summary', 'Read account inventory and shared module counts.', 1),
  ('pool-summary', 'Compute view summary', 'Count the registered modules available in each compute view.', 1),
  ('slubber-policy', 'Slubber permission policy', 'Read Digital Flubber guest permissions.', 1),
  ('sos-response', 'SOS response guide', 'Read the Digital Flubber containment drill.', 1);

INSERT OR IGNORE INTO cloud_slayer_module_views VALUES
  ('inventory-summary', 'supercomputer'), ('inventory-summary', 'hypercomputer'), ('inventory-summary', 'sos'),
  ('pool-summary', 'supercomputer'), ('pool-summary', 'hypercomputer'),
  ('slubber-policy', 'sos'), ('sos-response', 'sos');

INSERT INTO cloud_slayer_modules (module_id, label, description, active)
VALUES (
  'assessment-studio',
  'Assessment Studio · The Nathan Tabor Way',
  'Personality, IQ, strengths, and private QI/QE practice. Open https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/assessment-studio/',
  1
)
ON CONFLICT(module_id) DO UPDATE SET
  label = excluded.label,
  description = excluded.description;

INSERT OR IGNORE INTO cloud_slayer_module_views (module_id, view_name)
VALUES ('assessment-studio', 'supercomputer'), ('assessment-studio', 'hypercomputer');

INSERT INTO supercomputer_registry (id, name, kind, status, provenance)
VALUES (
  'tabor-reaper-6969',
  'THE REAPER 6969 ENGINE',
  'owner-workspace',
  'live-owner-access',
  'Tabor World Hub /reaper-6969; GitHub app-factory/tabor-world-hub/reaper-6969'
)
ON CONFLICT(id) DO NOTHING;

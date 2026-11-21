INSERT INTO supercomputer_registry (id, name, kind, status, provenance)
VALUES (
  'tabor-rhythm-matrix',
  'THE RHYTHM MATRIX',
  'public-workspace',
  'live',
  'Tabor World Hub /rhythm-matrix and GitHub app-factory/tabor-world-hub/rhythm-matrix'
)
ON CONFLICT(id) DO NOTHING;

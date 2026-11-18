CREATE TABLE IF NOT EXISTS fleet_batch (
  id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  source_ref TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS fleet_entry (
  id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 505),
  batch_id INTEGER NOT NULL REFERENCES fleet_batch(id),
  local_id INTEGER NOT NULL CHECK (local_id BETWEEN 1 AND 101),
  title TEXT,
  description TEXT,
  category TEXT,
  source_state TEXT NOT NULL CHECK (source_state IN ('catalog', 'worker_name', 'awaiting_source')),
  source_ref TEXT,
  worker_name TEXT,
  UNIQUE (batch_id, local_id),
  CHECK (id = (batch_id - 1) * 101 + local_id),
  CHECK (
    (source_state = 'catalog' AND title IS NOT NULL AND description IS NOT NULL AND source_ref IS NOT NULL) OR
    (source_state = 'worker_name' AND title IS NOT NULL AND worker_name IS NOT NULL AND description IS NULL) OR
    (source_state = 'awaiting_source' AND title IS NULL AND description IS NULL AND worker_name IS NULL)
  )
) STRICT;

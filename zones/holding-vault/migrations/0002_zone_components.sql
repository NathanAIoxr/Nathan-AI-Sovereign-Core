CREATE TABLE IF NOT EXISTS zone_components (
  workspace_id TEXT NOT NULL REFERENCES zones_registry(workspace_id),
  component_type TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_ref TEXT,
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
  snapshot_sha256 TEXT NOT NULL CHECK (length(snapshot_sha256) = 64),
  captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, source_table, source_id)
) STRICT;

CREATE INDEX IF NOT EXISTS zone_components_type_idx
  ON zone_components(workspace_id, component_type, source_table, source_id);

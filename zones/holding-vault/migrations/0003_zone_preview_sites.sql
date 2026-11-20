CREATE VIEW IF NOT EXISTS zone_preview_sites AS
SELECT workspace_id,
       substr(workspace_id,1,48) ||
       CASE WHEN length(workspace_id)>48 THEN '.'||substr(workspace_id,49) ELSE '' END ||
       '.zones.test' AS preview_hostname
FROM zones_registry;

CREATE VIEW IF NOT EXISTS zone_preview_parts AS
SELECT workspace_id, component_type, source_table, source_id, source_ref, captured_at, snapshot_sha256
FROM zone_components;

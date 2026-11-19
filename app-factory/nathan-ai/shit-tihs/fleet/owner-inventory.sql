-- Apply to the existing private tabor-fleet-registry database.
-- Each inventory row retains its observed, declared, or missing state.
CREATE VIEW IF NOT EXISTS shit_tihs_owner_fleet_v1 AS
SELECT 'shit-tihs' AS app_id, record_key, kind, title, location, source_ref, state, provenance, updated_at
FROM owned_runtime_registry;

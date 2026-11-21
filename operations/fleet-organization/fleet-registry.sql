-- READ ONLY. Run against the EXISTING tabor-fleet-registry database.
-- This does not create a database, Worker, or agent.
SELECT kind,state,COUNT(*) AS total FROM owned_runtime_registry GROUP BY kind,state ORDER BY kind,state;
SELECT source_state,COUNT(*) AS total FROM fleet_entry GROUP BY source_state;
SELECT record_type,COUNT(*) AS total FROM holding_worker_inventory_v1 GROUP BY record_type;
SELECT kind,state,COUNT(*) AS total FROM fleet_execution_evidence_v1 GROUP BY kind,state ORDER BY total DESC;
SELECT deployment_state,COUNT(*) AS total FROM virtual_supercomputer_slot_v1 GROUP BY deployment_state;
SELECT COUNT(*) AS verified_node_telemetry_receipts FROM sovereign_node_telemetry_v1;
-- Distinct canonical registry identities, not the sum of events and virtual slots:
SELECT COUNT(DISTINCT record_key) AS distinct_registry_identities FROM owned_runtime_registry;

# Existing Cloudflare fleet integration — discovered resources

Do not build a duplicate worker fleet or overwrite existing runtime records.

## Verified account resources (2026-11-19)
- D1 `tabor-fleet-registry` UUID `00e422eb-5222-4892-8f90-74aaf8ab0518`
  - `fleet_entry`: 505 records
  - `owned_runtime_registry`: 1,650 records
  - `virtual_app_v1`: 5 records
  - Also contains `fleet_execution_evidence_v1`, `owned_runtime_counts`, and `virtual_supercomputer_slot_v1`.
- D1 `tabor-database-registry` UUID `af177f57-154c-41a1-a5cd-5602568a4a2f`
  - Includes `tabor_worker_catalog_replicas`, `nathan_jobs`, `tabor_infra_jobs`, `true_cloud_jobs`, `tabor_agent_assignments`.
- D1 `tabor-autonomous-builds` UUID `f6d6879c-3b15-4ca0-93d4-1da1860b3b55`
  - Includes `build_job_meta`, `release_fleet_jobs_v1`, `app_store_release_jobs_v1`.
- D1 `nathan-ai-project-runner` UUID `c87e6d10-d25b-4580-ac4e-79367d32bee6`
  - Contains `runner_jobs`.

## Existing deployed Workers
`tabor-1000-fleet-index`, `tabor-agent-fleet-runtime`, `tabor-job-orchestrator`, `tabor-worker-101-registry`, `nathan-ai-project-runner`.

## Integration rule
The existing databases are authoritative. The proposed `nathan-ai-orchestration-core` is NOT deployed. Avoid deploying another controller until the existing Worker bindings, routes, permissions, and handler contracts have been inspected and reconciled. Do not equate logical runtime records with separately deployed Cloudflare Worker scripts.

## Verification before any write
1. Inspect each existing Worker's actual script bindings and routing.
2. Identify canonical job table and record lifecycle from source code.
3. Verify D1 migrations and current schema; preserve existing records.
4. Use a single bounded test job and confirm an execution receipt.
5. Only then update integration wiring, without changing unrelated projects.

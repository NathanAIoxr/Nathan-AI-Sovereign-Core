# MSP DAEMONS — WILL / WHEEL execution architecture

Nathan Tabor’s public role names are **MSP DAEMONS** and **IT Angels**. The role registry uses `DEAMON` as the existing machine identifier.

## Operational chain
WILL (owner authorization) → WHEEL (scheduler) → MSP DAEMON (service coordinator) → Worker Bot (bounded task executor) → Agent (specialist reasoning/validation) → VERIFY (auditable outcome).

## Isaiah 45:7 alignment

| Plane | KJV terms | Software role |
| --- | --- | --- |
| Above | Light and peace | IT Angels verify sources, report evidence, and review consent and recovery. |
| Below | Darkness and evil | MSP DAEMONS execute approved work and isolate failures. |

[Author wording and verse](duality/ORIGINAL_WORDS.md) · [Role registry](duality/roles.json) · [Live Isaiah 45:7 view](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/assessment-studio/#alignment)

## Independent MSP DAEMON families
- Build Daemon: source checks, package builds, reproducible artifacts.
- Deployment Daemon: capacity checks, dry runs, approved deployments and health verification.
- Security Daemon: own-asset configuration checks, least-privilege audit, incident triage.
- Data Daemon: schema validation, portable exports, consented migration.
- Concordance Daemon: citation/provenance checks, language index.
- Creative Daemon: game/app asset build queues.
- Pumpkin Daemon: fundraising, volunteer and logistics coordination via separate permissioned applications.
- Collyn Handoff Daemon: prepares a private review package; never sends without explicit approval.
- Inventory Daemon: reconcile GitHub projects and Cloudflare resources, without assuming live state.

## Contract
Each DAEMON has an ID, owner, scope, triggers, permitted tools, queue, timeout, retry ceiling, audit record, and stop control. Every task has a unique idempotency key and an explicit outcome: PLANNED, QUEUED, RUNNING, VERIFIED, BLOCKED, FAILED.

## Execution restrictions
No uncontrolled autonomous replication; no scanning third-party ports; no overriding access controls; no publishing private records; no assuming all described servers or hypercomputers are live. Existing resources must be inspected before binding. Cloudflare account Worker and Pages project limits currently prevent new deployments.

## Current implementation
This file defines the architecture. Existing GitHub Actions workflows perform inventory/quality checks, but do not constitute a live DAEMON fleet. Implement and test each independent executor before claiming activation.

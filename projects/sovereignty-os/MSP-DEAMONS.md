# MSP DEAMONS — WILL / WHEEL execution architecture

Author-defined terminology: **MSPs ARE DEAMONS**. Preserve the spelling DEAMON. This is a Nathan AI system role, not a claim that MSP universally means daemon in conventional IT.

## Operational chain
WILL (owner authorization) → WHEEL (scheduler) → MSP DEAMON (service coordinator) → Worker Bot (bounded task executor) → Agent (specialist reasoning/validation) → VERIFY (auditable outcome).

## Independent MSP DEAMON families
- Build Deamon: source checks, package builds, reproducible artifacts.
- Deployment Deamon: capacity checks, dry runs, approved deployments and health verification.
- Security Deamon: own-asset configuration checks, least-privilege audit, incident triage.
- Data Deamon: schema validation, portable exports, consented migration.
- Concordance Deamon: citation/provenance checks, language index.
- Creative Deamon: game/app asset build queues.
- Pumpkin Deamon: fundraising, volunteer and logistics coordination via separate permissioned applications.
- Collyn Handoff Deamon: prepares a private review package; never sends without explicit approval.
- Inventory Deamon: reconcile GitHub projects and Cloudflare resources, without assuming live state.

## Contract
Each DEAMON has an ID, owner, scope, triggers, permitted tools, queue, timeout, retry ceiling, audit record, and stop control. Every task has a unique idempotency key and an explicit outcome: PLANNED, QUEUED, RUNNING, VERIFIED, BLOCKED, FAILED.

## Execution restrictions
No uncontrolled autonomous replication; no scanning third-party ports; no overriding access controls; no publishing private records; no assuming all described servers or hypercomputers are live. Existing resources must be inspected before binding. Cloudflare account Worker and Pages project limits currently prevent new deployments.

## Current implementation
This file defines the architecture. Existing GitHub Actions workflows perform inventory/quality checks, but do not constitute a live DEAMON fleet. Implement and test each independent executor before claiming activation.

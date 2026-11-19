# Pumpkin Patch + CT Inc. — Reuse-first integration and worker backlog

Status: integration branch; **not** a claim of production readiness. Preserve all existing source and services.

## Existing Cloudflare resources verified by account inspection (2026-11-19)
- D1: handling_life_db, toy_drive_db, cup_of_hope_db, plate_of_love_db.
- D1: nathan-ai-global-catalog, tabor-fleet-registry, nathan-ai-comms-ledger, nathan-ai-cockpit-ledger.
- Existing Workers include nathan-ai-fleet and nathan-ai-project-runner. Do not overwrite.
- The GitHub README links existing source: app-factory/nathan-ai/icu-buddy/, app-factory/nathan-ai/ta-da-taters-daters/, app-factory/nathan-ai/relationship-intent-clarifier/, and app-factory/sovereign-hub/.
- Verify each source path, tests, API contract, runtime, license, and deploy before claiming integration.

## Architecture boundaries
1. Core church OS: CT Inc. admin, websites, member roles, calendar, bulletin, video, voice drafting.
2. Logistics: Pumpkin Driver, Pumpkin Volunteer, Pumpkin Network Console, dispatch, HOS, POS and signed deliveries.
3. Commerce: truck-drop, print-on-demand, Sunday-school supplies, separate tier schedules, cash vs credits ledgers.
4. Optional licensed apps: dating (adults only), community care, games, AI study, holiday experiences. Separate deployment and data boundaries; branding is opt-in.
5. Shared integration: tenant registry, permissions, event contracts, feature flags, audit trails, pricing configuration, provisioning.

## Build queue — execute in order, claim each job atomically
- P0 INVENTORY: inspect existing repo directories, Cloudflare scripts/bindings/D1 schemas; record actual SHA, endpoint, owner, deployment status. Do not clone or replace working modules.
- P0 SECURITY: implement verified tenant auth, organization membership, authorization checks, secrets isolation; isolate sensitive dating, nursery, giving, prayer and care records. Never rely on tenant_id alone.
- P0 FINANCE: integer-cent ledgers, idempotent Stripe webhook processing, reconciled donation receipts, refund handling, tax eligibility review, consent for recurring charges. Proposed payout tiers require commercial approval.
- P1 ADAPTERS: versioned APIs and event envelopes for existing Driver/Volunteer/Network, CT Inc., iCU Buddy, toy drive and other services; write contract tests first.
- P1 STORE: B2B supplies, fundraising, preorders, POD fulfillment, organization-specific price books and supply credits.
- P1 MEDIA: Cloudflare Stream live/VOD, transcript jobs, explicit media rights and publishing approvals.
- P1 VOICE: speech-to-draft schedule; human approval before external publication, payment or sensitive communication.
- P2 WHITE LABEL: tenant domain verification, brand themes, optional app licenses, staged provisioner, rollback.
- P2 COMMUNITY: opt-in game, fellowship and care modules with safeguarding and moderation.
- P2 OBSERVABILITY: queue dead-letter handling, audit trail, usage metrics, error budgets and deployment receipts.

## Worker orchestration
Use an authorized scheduled coordinator to enqueue bounded jobs through Cloudflare Queues or Workflows. Each job has {job_id, project_id, repository, source_sha, requested_change, authorization_scope, claim_owner, lease_expires_at, retry_count, idempotency_key, status, evidence}. Only one active claim per job. Never import arbitrary external agents, execute unreviewed code, expose secrets, or self-replicate. No production deployment without passing tests and approved permissions.

## Release gates
Inventory -> tests -> PR -> human review for financial/security/data changes -> staging deploy -> smoke tests -> production approval -> verified deployment URL, D1 migration ID, log and rollback instructions. Never represent planning notes as deployed infrastructure.

## Follow-on agent instructions
Before implementing any feature: search existing code and deployed resources; compare capabilities; prefer adapter or small reversible change; preserve exact original source; record evidence and gaps; create a separate PR; stop when credentials, consent, legal clearance, or production approval are missing.

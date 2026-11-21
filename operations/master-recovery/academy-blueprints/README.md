# Tabor Academy Blueprints Conductor handoff

The [production release](https://tabor-academy-blueprints.pages.dev) and both GitHub change branches are recorded in [the handoff](/operations/master-recovery/academy-blueprints/handoff.json). The production snapshot contains 30 verified blueprint lessons. The separate curriculum index contains 597 entries, and the Academy database records 26 sources and 28 import jobs. These counts describe different records.

Cloudflare Build Loop plan `4fbb61bf-1d33-45c1-87a5-92b14cd18589` is attached to the existing five-minute Cron Trigger. The [plan](build-plan.json) includes one deterministic claim probe and five draft modules. Generated drafts require integration tests and a verified deployment receipt before release. The two hourly lanes are described in the handoff. Use the existing release fleet lease and transition procedure documented in [the fleet runbook](../../../standalone-apps/release-fleet/README.md).

Run `node operations/master-recovery/academy-blueprints/verify-release.mjs` to check the live curriculum API, exported SHA-256, lesson IDs, and single-file download. Repository owners can compare the output to Cloudflare's deployment ID and GitHub source commit. The GitHub Action keeps a copy of the public verification output per run.

The [estate recovery issue](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/524) tracks other products by their own canonical identities. Read the exact [authored Phase 1–7 requirements](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/c153322d9a47b302115c4bc95b764639649ef83b/app-factory/tabor-academy-blueprints/spec/MASTER-HANDOFF-PHASES-1-7.txt) when marking the Academy feature state.

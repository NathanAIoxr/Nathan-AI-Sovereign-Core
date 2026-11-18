# Tabor Persona Atlas — Reaper × Santa × Buddy × Hunny × MAS SPIRIT

**Author:** Nathan Tabor · **Status:** source-backed additive public-safe prototype + bounded Cloudflare scheduler.

This project integrates the creator's Santa/Reaper duality, KJV Isaiah 45:7 comparison with yin and yang, White Dog/Black Dog family metaphor, HH Lifestyle, Buddy Boo & Hunny Zoo, MAS SPIRIT branch and Nathan AI role labels. A creative/persona model is not a claim of independently conscious agents or literal external operations.

## Existing integrations (non-destructive)

- [Tabor Train operational roster](../../app-factory/nathan-ai/operations/train-runtime/README.md) — RAM / OCTOPUS / CONVOY, including REAPER AI and Santa Claus AI.
- [Santa Claus Factory](../../app-factory/sites/santa-claus-factory/index.html) — original Christmas studio preserved.
- [Nexus MAS SPIRIT authoritative GitHub snapshot](../nexus-mas-spirit/canon.json) — preserves the v2026-11-14 names and variant spellings.
- Library of Tabor and Nathan AI fleet — existing Cloudflare script names recorded as read-only references, not network-connected synchronizations.

**Canon conflict flagged:** Existing GitHub canon says SANTA SUPMALG is current and SANTA SUPMALS is earlier; other prior materials refer to SUPMALS as current. Both forms remain available; the registry explicitly asks for human source verification rather than replacing an original.

## API

`GET /` is a responsive, text-first creator directory. `GET /api/health`, `/api/graph`, `/api/characters`, `/api/backlog`, `/api/integrations`, and `/api/receipts` are read-only. No incoming POST/PUT/PATCH/DELETE is accepted. No private Gmail bodies, personal records, secrets, faces, or unreleased artwork are committed.

## Scheduling

Cloudflare Cron `*/15 * * * *` rotates a *maximum three-item public backlog review batch* and writes a timestamped receipt to one dedicated KV namespace. It never marks development tasks complete; it does not write GitHub, call untrusted URLs, scan external networks, touch other Workers, publish art, or make payments. A separate, owner-authorized human/agent review loop implements code and tests through PRs.

## Verified deployment receipt (November 18, 2026)

- Cloudflare script: `tabor-persona-duality`; deployment API reports an active version at 100%.
- workers.dev routing: enabled; expected public endpoint `https://tabor-persona-duality.nathantaboract.workers.dev/` and `/api/health`. Direct HTTP verification was unavailable to the initiating browsing tool, so the endpoint is not independently smoke-tested here.
- Cron Trigger: `*/15 * * * *` saved and read back from Cloudflare.
- KV namespace: `tabor-persona-duality-receipts` created and bound as `RECEIPTS` through module upload metadata. This does not establish a completed cron invocation; inspect `/api/receipts` after a scheduled event.
- GitHub CI: [Persona Atlas workflow run](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/actions/runs/44401670227) succeeded on the initial feature branch. Future commits require fresh CI.

Run `node --test creative-archive/persona-duality/worker.test.mjs`. The public GitHub repo is not a safe place for private original source/asset archives; transfer those only to approved access-controlled storage.

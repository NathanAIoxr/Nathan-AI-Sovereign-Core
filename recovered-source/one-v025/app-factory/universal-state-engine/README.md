# TABOR ROOT — UNIVERSAL 101 STATE ENGINE

**Owner:** Nathan Tabor. **Parent:** TABOR 1-2-3 FACTORY™.

The conversation contains the private downloadable build package **TABOR_UNIVERSAL_101_STATE_ENGINE_WORK_BUILD.zip**. The package contains a fully runnable **localhost-only** FastAPI + SQLite + browser demonstration and a Unity C# API client reference.

## Five pillars
1. Domain wisdom and bounded contexts, glossary, rules.
2. Strict attributes, entity identities, value objects, aggregate snapshots, versioned schema.
3. Pure validated domain actions, legal transitions, generated domain events.
4. API/repository adapters, SQLite transactions, idempotent commands and audit journal.
5. Local Docker; production PostgreSQL/cloud adapters to be implemented with real identity and authorization.

## Working modules
- **Hero Puzzle:** server-validated 5×5 tile swaps, matched symbol rows, damage calculation, gold and XP.
- **Town Builder:** begin and complete server-clock-verified structure upgrades, resource spending.
- **Healers & Protectors:** resource-limited civilian rescue and services.
- **Creative Factory:** server-validated task creation and completion.

**Evidence:** 15 pytest tests passed, including workspace demo scoping, rejection of client-minted gold, version conflicts, replayed idempotent commands, timed upgrade checks, and event-chain generation. Actual API smoke roundtrip also passed. Browser JS syntax passed; browser is included, not independently end-to-end tested on a physical iPhone.

## Build package details
- `server/main.py`, `server/engine.py`, `server/store.py`
- `web/index.html`, `web/app.js`
- `schemas/player_state.schema.json`, `schemas/command.schema.json`
- `unity/TaborStateClient.cs` (reference only)
- `tests/test_engine.py`, `tests/test_api.py`
- Dockerfile, docker-compose.yml, sample state, SHA256 manifest, README and Work handoff.

## Critical security boundary
**DO NOT DEPLOY PUBLICLY.** Development identity is a forged-client-controllable `X-Owner` header, intentionally NOT real authentication. The service refuses non-development `TABOR_ENV` startup. Upgrade to OIDC/passkeys, tenant ACL, public HTTPS, rate limiting, PostgreSQL transactional adapter, real purchase ledger/receipts, cloud backup and data governance before launch. This package offers **no real banking, paid loot, app purchases, multiplayer, or provider credentials**.

## Instructions to ChatGPT Work
Attach **TABOR_UNIVERSAL_101_STATE_ENGINE_WORK_BUILD.zip** and read `WORK_START_HERE.md`. Run `python -m pytest tests -q`, start `uvicorn server.main:app --host 127.0.0.1 --port 8000`, then test the browser panel at localhost and the four domains. Preserve code/tests; implement secure auth, PostgreSQL migration, separate financial ledgers, plugin contracts, game clients, stress testing, deployment/recovery and additional bounded contexts.

Maintain project boundaries for ONE, TABOR WORLD, 1420, TaborTales, TABOR INFINITUM and Creative Factory while sharing permissioned root services. Original game name and visual rights are not implicitly transferred by the shared engine.

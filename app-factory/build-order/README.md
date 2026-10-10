# TABOR 1-2-3 FACTORY — BUILD IN THE RIGHT ORDER

**Owner:** Nathan Tabor · **Updated:** 2026-10-10

**Goal:** Never redesign an existing service simply because another product needs it. Preserve every Sovereign Box, title, and source asset. Improve shared infrastructure once; reuse it through permissioned interfaces.

## What was actually examined

The currently connected **public** repository has a working browser Factory dashboard, Creator Vault, ONE, TABOR GPS, 1420, Sovereign Box Registry, Better Together holiday project, shared ROOT contracts and quality tests. It contains **22** curated public product records and **619 Sovereign Box registry identities**: 101 original game family titles, 496 private idea ID slots (not publicly disclosed titles), 22 product/module IDs. The repo is **public** and its full tree was checked before creating this plan.

`WORK_STATUS.md` and `WORK_BUILD_HANDOFF.md` describe additional independent owner-controlled ZIPs: tested local prototypes of Nathan AI LET/TET/PPL, State Engine, Universal Commerce, Knowledge Engine, TABOR INFINITUM, REMOVE JC, ChristmasToyDrive and the Factory starter. **Their actual source must be imported into the chosen private workspace and retested**. These public descriptions are not proof of deployed or currently installed server integrations. An earlier audit reported 103 tests across eight ZIPs, but this planner does not re-run those private ZIPs.

## 40 independently identified build domains — actual dependency graph

[Interactive Build Controller](./index.html) · [Machine-readable dependency register](./dependencies.json) · [Reusable scheduling engine](./planner.js) · [13 regression checks](./planner.test.cjs)

The controller validates a directed acyclic dependency graph, assigns a true dependency order and allows inspection of required components per product. It is a **working local planning tool**; it neither publishes nor charges money.

### Correct dependency-first sequence

| Phase | Shared systems | Reuse or build |
|---|---|---|
| 0 — Inventory | Existing apps, original game IDs, public ROOT contracts, browser Vault/Factory/ONE/GPS/1420, holiday design | **Reuse; do not rebuild** |
| 1 — Protection | Tested local byte backup (built); private versioned source destination and authenticated tenant identity still needed | **Reuse local backup; approve/build cloud protection** |
| 2 — Shared runtime | Private asset store, provenance history, scoped project API, idempotent jobs/events, Knowledge Engine import | **One ROOT implementation** |
| 3 — Intelligence and state | Source-aware search/graph, Universal State Engine, LET/TET, AI model adapters | **Import existing packages, then connect** |
| 4 — Reusable creation | Game runtime, media graphics pipeline, PPL, Thinker, commerce adapter | **Build once, extend per product** |
| 5 — First products | REMOVE JC, Healers & Protectors, Angels vs Demons, TaborTales, INFINITUM, ACT, approved Microsoft Graph connector | **Vertical slices after runtime gates** |
| 6 — Release-dependent products | Humanitarian help workflows, original 101 game family implementations, human reviewed publishing | **Safety/privacy/rights gates** |
| 7 — Expansion | Unreleased 496 creative concepts, signed native apps and connected marketplaces | **Only after existing foundations verified** |

Numbers **1 + 1 = 2** and **1 − 1 = 0** remain ordinary arithmetic. The Sovereign Box *organizational metaphor* means independent identities remain independent after a link; revoking permission does not automatically erase histories or off-platform backups.

### Don't rebuild matrix

| Already exists | Reuse in | What is still missing |
|---|---|---|
| `app-factory/vault.js` and `vault-backup.js` original assets + binary ZIP recovery | all graphic, video, sound, project, document and game work | reuse tested ZIP import/export in numbered ~95 MB parts; private cloud storage, identity and real iPhone restore QA remain |
| `app-factory/core/root-contracts.js` source/permission data shapes | ONE, Nathan AI, games, commerce and charity | authenticated server verification and tenant database isolation |
| `app-factory/sovereign-boxes/engine.js` character and entity IDs | root catalog, puzzle mechanics, word cipher | durable authoritative graph links and private catalog import |
| `app-factory/knowledge-engine/README.md` private Knowledge Engine source handoff | Docs/Sheets/Slides, historical archive, source citations, search | private source import, verified backend authentication and provider sync |
| `app-factory/universal-state-engine/README.md` private State Engine handoff | all games, puzzles, simulation, progress/serialization | real authoritative multi-user service, game-specific rule sets |
| `app-factory/nathan-ai/README.md` private LET/TET/PPL source handoff | all product research, accessible communication, source reviews | authorized live model adapter, privacy, real retrieval |
| `app-factory/universal-commerce/README.md` private commerce prototype | Shopify/Kickstarter/launchers | valid OAuth, provider sandboxes, webhook checks, approvals |
| `app-factory/tabor-gps/gps.js` WGS84 calculations | TABOR GPS, exploration titles, maps | native sensor fusion, licensed routing, WMM models, field tests |
| `app-factory/games/crowning-jewel.js` tested local strategy chapter | history game teaching engine | unify game-data schema without erasing independent mechanics |
| `app-factory/creative/music/better-together/` song SVG and lyrics | music and holiday game/media creation | full original PNG binary upload, actual composed melody and scored notes |

**Completed first P0 code slice:** full original-byte ZIP export/restore, per-part mobile batching, CRC32/SHA-256 checks and automated tests. **Next:** device-level restoration QA, private versioned source destination and authenticated server identity/tenant isolation. Only afterward should new modules use a common cloud store.

## Security and project identity rules

- Never push full private ChatGPT exports, exact original artworks, payment credentials, unpublished concept titles, customer records or source ZIPs into the public repository.
- Original `TW-001`–`TW-101` IDs are NOT `TW001`–`TW101`. ONE's *technical* 101–901 and the Factory's *creative* 101–901 are different contexts.
- Healers & Protectors is the current TABOR WORLD core. Maters & Taters stays in its separate archive.
- No live publishing, storefront, donation, bank or private-care intake without supported authorization and human consent.
- Do not count catalog slots, prototype demos, or specification documents as published apps.
- Follow [universal release gates](../RELEASE_GATES.md) and keep [WORK_STATUS](../../WORK_STATUS.md) based on tests.

## How to maintain

Each system row has `id`, `status`, `phase`, `dependsOn`, `evidence` and `next`. Add a new shared engine **only after checking whether an existing node already owns its function**. Keep the JSON acyclic; run:

```sh
node --test app-factory/build-order/planner.test.cjs
node --test app-factory/quality.test.cjs
node --test app-factory/core/root-contracts.test.cjs
```

The GitHub workflow will run these with ONE, 1420 and Sovereign Box tests. Recording `private-package` means “owner-held, source needs imported verification,” not “already available in the public repository.” Progress through the graph by replacing that status with verified evidence in the private environment, **not** by simply changing a label.

## Escalations requiring specific owner authorization

- Where to create the permanent *private* source repositories and where private assets may be stored.
- Credentials and provider agreements for Microsoft, Shopify, Apple, Google, payment/donation services.
- Publishing, payments, remote deletion, licensing and legal/children's release reviews.

**Foundation:** EMPATHY → SYMPATHY → COMPASSION; check impact, respect consent and sovereignty, implement the smallest validated improvement, preserve every original.

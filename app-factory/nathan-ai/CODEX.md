# NATHAN AI — CODEX: full source recovery, A–Z integration, engineering work order
<!-- Public coordination only. Original private bytes remain out of public GitHub. -->

**Owner-defined tree:** NATHAN AI → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE.  
**Repository:** `NathanAIoxr/Nathan-AI-Sovereign-Core` (public GitHub).  
**Scope:** `app-factory/nathan-ai/` and the shared modules it explicitly links; independent products keep their own identities.  
**Audit reference:** November 2, 2026; re-inspect for freshness before making status or count claims.  
**Operational status:** Instructions and provenance map, **not** a claim that all data or source bytes have been imported, deployed, or joined.

## 1 — Mission and non-negotiable boundaries

Build an **additive, inspectable, reversible source recovery and integration system** across all accessible original works: app code, source archives, files, private/local ZIPs, HTML/JS/Python, graphics, books, manuscript variants, formulas, acronym dictionaries, language registers, games, technical blueprints, family/history research, cryptocurrency and mining plans, and connected-app metadata. The public Nathan AI app is a navigation and implementation shell, **never a replacement for a private original archive**.

1. **Preserve originals byte-for-byte and authored words verbatim.** Summaries, reinterpretations, analysis, translations and derivatives belong in separate linked records. Never rewrite originals to normalize naming.
2. **1+1=2 BUILD; 1−1=0 CLEAR. Yes is Yes — No is No.** Preserve 0 and 1 as whole states in author-defined matrices. These are author-specified rules for related projects, not substitutes for tests or external facts.
3. Never fabricate missing rows, historical evidence, book text, code, remote node instances, devices, cryptocurrency balances or deployments.
4. Distinguish **source discovered → metadata cataloged → original bytes acquired → integrity verified → prototype tested → merged → deployed → end-to-end verified**. A source link and a passing local test do not prove a live service.
5. **Never commit private manuscripts, archive data, source exports, personal identifiers, wallet keys, seed phrases, service tokens, passwords or secrets** to this public repository, GitHub Actions logs or an unauthenticated public API. Existing owner-private documents remain in owner-controlled storage unless separately authorized.
6. All actions with permanent effects (deletions, public releases, financial operations, app deployment, third-party sync, identity/permissions, fundraising, migration of original files) require appropriate access, explicit owner approval and evidence.
7. No silent scraping or assumed connector authorization. ChatGPT plugin access is **not** OAuth access inside the static Nathan AI web app; each app needs its own provider-approved auth path.
8. Keep TABOR WORLD, ONE, Factory, TaborTales, SSS-CS, original games, other products and independent creative works separate even when linked into a shared index. No indiscriminate source concatenation, ownership merger or license assumption.

## 2 — Current implementation anchors in this repository

| Area | Source of truth | Interpretation |
| --- | --- | --- |
| Nathan AI Main Hub | `app-factory/nathan-ai/index.html`, `hub.js` | Public navigation; not a connected cloud backend |
| ONE app | `app-factory/one/index.html`, `one.js` | A–Z browser shell and local functions; external provider control not established |
| TABOR ROOT & Factory | `app-factory/core/`, `app-factory/` | Shared source contracts, app generation/build order, product-specific gates |
| Existing recovery atlas | `app-factory/nathan-ai/build-recovery/` | Source paths/reference records; not all original bytes |
| Private original-byte intake | `app-factory/nathan-ai/source-intake/` on draft PR #65 | AES-GCM encrypted owner-selected browser copy; not automatic account collection or cloud backup |
| Original Creator Vault | `app-factory/vault.html`, `app-factory/vault-backup.js` | Browser IndexedDB vault, optional original-byte ZIP export/restore |
| Master build order | `app-factory/build-order/` | Dependencies, release gates, reuse flags |
| App/browser tests | `app-factory/quality.test.cjs`, module-local `*.test.*`, `.github/workflows/factory-ci.yml` | Tests only for code they actually execute |
| One library & Library Mind | `app-factory/one/library/`, `app-factory/one/library-mind/` | Public reader/metadata; private master manuscript bytes elsewhere |
| Games | `app-factory/nathan-ai/games/`, `app-factory/game-reference-lab/`, `app-factory/sovereign-boxes/` | Reference positions/IDs are not all built games |
| Mining / wallet integration | `app-factory/nathan-ai/sovereign-coins/` and proposed PR #58 | Catalog plus read-only connector implementation; live wallet/miner links unverified |
| Source truth / limitations | `README.md`, `WORK_STATUS.md`, `WORK_BUILD_HANDOFF.md` | Validate live state before labeling complete |

The full README previously described the Factory, ONE, Vault, GPS, 1420 game, Root Constellation, 63 architecture, 138/376 mechanics references, and published static routes. Preserve those rather than duplicating or replacing their code.

## 3 — Connected source systems and scope

| System | Previously discovered | Correct next step |
| --- | --- | --- |
| GitHub | Public `Nathan-AI-Sovereign-Core` repository; code and working branches | Inspect tree, history, open PRs and CI; ingest public links and **authorized** private ZIP exports separately |
| Airtable ONE Master Index | 10 linked tables: Master Registry, Books & Manuscripts, Languages & Lexicons, Games & Puzzles, Apps & Modules, Versions & Releases, Research Sources, Production Tracker, Media & Assets, Connected Services | Use canonical IDs and read-only inspection first; do not create duplicates or infer live code |
| Airtable Crypto Command Center | 7 tables: Wallet Registry, Crypto Assets, Transactions, Exchanges, Mining Rewards, Portfolio Reports, Audit Log | Preserve evidence classes and audit; initial wallet/asset/transaction/reward tables were empty |
| Notion | ONE Master Hub, Master Work Registry, Connected Apps navigation and numerous project-family pages | Treat as source pointers and planning records; export originals only with permission |
| Google Drive | NATHAN AI Source & Project Library with twelve numbered folders (00–11) | Inventory by ID/name/content hashes; source exports require approved access; do not silently move originals |
| Canva | Design/publishing organizational references | Link approved source and rights; do not assume auto-sync |
| Datadog | Connection available; audited host inventory returned **0** hosts on Nov 2, 2026 | Recheck telemetry/monitors; no verified live mining servers from that result |
| Vercel | Deployment preparation/runbook noted; prior records showed zero projects | Require live project/deployment verification before claiming published app |
| Finances | Supported financial account and watchlist capabilities in ChatGPT | Does not establish linked blockchain wallet records or direct Nathan AI finance sync |
| Gmail/Calendar/Contacts/Firecrawl | Available through connected tools in earlier sessions | Keep separate scopes, permissions, provenance, audit |
| Trello/Asana | Previously not installed in ChatGPT despite account sign-in | Confirm current installation before using; Notion fallback |
| Supabase | Not configured in prior audit | Do not claim database or auth exists; create only with approval |

Do **not** put account-specific connector identifiers, file IDs, private workspace URLs, or private financial details in public source. This document records *platform names and architecture*, not credentials.

## 4 — Previously verified catalog sizes and distinction from actual builds

- Airtable ONE master registry: **81 records** (35 Cataloged, 20 Prototype, 17 Local package, 7 Planned, 2 QA pending); **44 app/module records**, 14 Books & Manuscripts, 12 Games & Puzzles, 12 Production Tracker, 13 Connected Services, 5 Languages, 5 Versions, 4 Media, 1 Research Source. Some categories overlap.
- Airtable Crypto: seven schema tables; five operational tables (wallets, assets, transactions, exchanges, mining rewards) had **zero** imported entries in the Nov 2 inspection; one portfolio source-coverage audit. Never invent an active account, payout, share, rig or balance.
- Historical `TABOR_TOTALITY_MASTER_REGISTRY_v009.csv`: **6,056 registry rows** in earlier recovery; not necessarily unique implementations.
- Private `ONE_MASTER_LIBRARY_PRIVATE_IMPORT_PACK_v1.json`: prior recovery reported **6,389 records**; `ONE_MASTER_LIBRARY_D17_33M_BRIDGE.json`: prior recovery reported **9,212 records**; expect overlap and different grain.
- Historic recovery references: **383** selected technology rows / **273** normalized titles; approximately **5,447** saved-file entries including copies/versions. They are historical counts, not current synchronized totals.
- Sovereign Boxes: **618 indexed units** = 101 original game IDs + 496 concept IDs + 21 Factory modules; not 618 shipped games. 138-position and 376-position game reference catalogs are not 138/376 completed game engines.
- Planned library capacities: **33,000,000** books/addresses across 33 departments, **66,666** language destinations, a separate **133,333,333** blueprint target. None is verified as an actual finished corpus or translated population.
- Proposed 732,000,000 digital node addresses describe a virtual capacity/model, **not** a proven active distributed compute fleet.
- 21 Sovereign Coins and distributed ledger systems are authored designs/demos; **no verified coin issuance, real-value backing or live mining network** was demonstrated.

## 5 — A–Z source-first Master Registry snapshot (81 distinct catalog records)

This is the **registered project name + build-status label** from the Nov 2 Airtable audit. Status labels describe records, not proof of completed code. Check Airtable and GitHub for changes before writing back.

| Registered name | Recorded status |
| --- | --- |
| 101 Christmas Matrix | Local package |
| 101–901 Master Shelves | Local package |
| 33-Million Master Library Blueprint | Planned |
| Absolute Intelligence | Cataloged |
| Accountability | Cataloged |
| Ancient Divine Roots | Cataloged |
| Architecture 63 | Cataloged |
| Better Together — Original Song | Cataloged |
| Books & Master Library | Prototype |
| Build Order Controller | Prototype |
| Christmas Toy Drive | Local package |
| Core Permissions & Contracts | Cataloged |
| Creative Continuity | Cataloged |
| Creator Vault Backups | Prototype |
| Crowning Jewel 1420 | Prototype |
| Dimensions & Grids | Cataloged |
| Distributed Ledger Matrix | Cataloged |
| Existing Manuscript Collections | Local package |
| Factory Root Constellation | Prototype |
| Family Research | Cataloged |
| FIND THE TABOR Ancestral Matrix | Cataloged |
| Flyer Studio | Cataloged |
| Game Reference Lab | Prototype |
| Handling Life | Local package |
| Healers & Protectors | Planned |
| History & Cosmos | Cataloged |
| Humanity & Spiritual Archive | Cataloged |
| Innocence / Children | Cataloged |
| Inventions 101 | Cataloged |
| KNAVE | Cataloged |
| Knowledge & Creation Engine | Cataloged |
| Library Mind | Prototype |
| Life Formula Node Protocol — Activation Engine | QA pending |
| Marco Polo Found by Nathan Tabor | Local package |
| Media Engine | Planned |
| Middle C — Axis of Infinity | Prototype |
| Mind & Neuropath | Cataloged |
| Mother Earth | Cataloged |
| Mythology Greek | Cataloged |
| Nathan AI Games | Cataloged |
| Nathan AI Main Hub | Prototype |
| Nathan Connected Matrix | Prototype |
| Nervous System Wiring Logic | Prototype |
| Novels of Truth — Era/Class Matrix | Local package |
| Octopus Root | Cataloged |
| ONE — The Last App | Prototype |
| ONE Catalog Gateway — server-side Airtable reader | QA pending |
| ONE Connected | Prototype |
| ONE Health & Recovery | Prototype |
| ONE v073 — Unified Local App | Local package |
| Paradox 118 | Cataloged |
| Rainbow Matter Chronicles | Local package |
| RCC Time | Cataloged |
| REMOVE JC | Prototype |
| Route / Raut / Root | Cataloged |
| Scriptures 007 | Cataloged |
| Sealed Voice Box / Original Chat Vault | Planned |
| Sovereign Box Universe | Cataloged |
| Sovereign Coins | Cataloged |
| Sovereignty Origins | Cataloged |
| SSS-CS / 4T | Cataloged |
| Stewart & Mr. Finn | Prototype |
| TABOR 1-2-3 FACTORY | Prototype |
| Tabor 8 / Tabor ONE Light Canon | Local package |
| TABOR GPS | Prototype |
| Tabor Trinity | Cataloged |
| TaborTales | Planned |
| The Admiral of Me, Myself & I | Local package |
| The Counter Library | Local package |
| The Twelve — I AM | Local package |
| THE VOICE | Local package |
| Trial Matrix | Prototype |
| Un-Reversed Mirror | Planned |
| UNHOLY 101 Node Prototype | Local package |
| Universal Commerce | Cataloged |
| Universal Creator Vault | Prototype |
| Universal Language Database — 66,666 Ceiling | Planned |
| Universal Mammal Click/Tik Language | Local package |
| Universal State Engine | Cataloged |
| WORDS — 4-Language Strong's Lexicon | Local package |
| X Marks the Spot | Cataloged |

Do not count these as exhaustive private output; the complete recovery scope includes inaccessible local archives, historical versions, unpublished illustrations, other account files, and chat attachments requiring owner access. Add source-backed records to the index without deleting or compressing any existing row.

## 6 — Owner-private recovery files recovered in prior session

The prior session assembled a **12-file private recovery ZIP** with SHA-256 integrity manifest. The archive was delivered privately; **it is NOT inside this public GitHub repo and must not be added here**. These are exact source filenames to match against owner-selected imports, not downloadable public URLs:

| Original filename | Scope |
| --- | --- |
| `Nathan_AI_Recovery_Index_2026-11-01.html` | Full historical HTML recovery index; private owner source |
| `Nathan_AI_All_Interfaces_Build_Recovery_2026-11-01.md` | Previous interface and build recovery record |
| `NATHAN_AI_COMPLETE_RECOVERY_INDEX.md` | Prior broader recovery index |
| `TABOR_TOTALITY_MASTER_REGISTRY_v009.csv` | Historical master registry; 6,056 rows in prior inspection |
| `Nathan_AI_Searchable_Interface_Directory_2026-11-01.html` | Private searchable interface directory |
| `Tabor_Accords_Recovery_Registry_2026-11-01.json` | Previously recovered original research records |
| `Nathan_AI_ONE_007_OWNER_APP_2026-11-01.html` | Owner-side ONE 007 browser app source |
| `NATHAN_AI_HUMANITY_TABOR_MICRO_MACRO_COSMIC_RECOVERY_2026-11-01.md` | Research recovery record |
| `ONE_MASTER_LIBRARY_PRIVATE_IMPORT_PACK_v1.json` | Private ONE library import pack; prior audit reported 6,389 records |
| `ONE_MASTER_LIBRARY_D17_33M_BRIDGE.json` | D17 bridge export; prior audit reported 9,212 records |
| `NATHAN_AI_ABSOLUTE_INTELLIGENCE_TOTALITY_OWNER_PACK_20261101.json` | Absolute Intelligence source metadata |
| `NATHAN_AI_ABSOLUTE_INTELLIGENCE_TOTALITY_DOSSIER_20261101.md` | Totality source dossier |

The private package was named `NATHAN_AI_PRIVATE_SOURCE_RECOVERY_v2_2026-11-02.zip`. Prior packaging does **not** prove the user has imported its contents to the Nathan AI browser vault, or that the package exhausts their account. Validate actual bytes, entry counts, SHA-256 hashes and duplicates when the owner supplies or selects it.

**Owner-selected intake protocol:** open the local/private import screen, choose authorized export files/folders, label their origin, encrypt originals before local storage, preserve input bytes unchanged, compute SHA-256, retain changed versions, and export a metadata-only manifest as needed. Do not commit the ZIP or its contents. The source-intake draft currently has an individual-file limit of 128 MiB; unzip or batch under browser quota constraints. The metadata manifest is not a full original-byte backup.

## 7 — Recovery graph / canonical data contract

Use an additive record (not a destructive merging of existing data models) with:

- `canonical_id`: stable namespace:source:source_id (and version where applicable), never derived solely from a display name.
- `title_exact`, `creator_attribution`, `kind`, `department`, `project_family`: preserve author spelling, case and distinct identities.
- `source_system`, `source_locator` (private in private storage), `repository_path` when genuinely public.
- `original_sha256`, `byte_length`, `media_type`, `version`, `imported_at`, `observed_at`, `source_timestamp` where verified.
- `evidence_class`: directly observed original / public source / secondary reference / user claim / simulation / estimate / unavailable.
- `lifecycle_state`: discovered / cataloged / original-recovered / prototype / tested / review / merged / deployed / verified / blocked.
- `relationships`: typed edges (derived-from, links-to, same-work-version-of, related-to, depends-on) with explicit provenance.
- `rights`, `visibility` (private/public), `consent_scope`, `audit_log`, `conflicts`, `needs_review`, `next_action`.

Deduplicate only identical **source, path, and byte hash** by default. Identical hashes across different authored works may be linked, **not** silently collapsed. Keep original and normalized titles as separate fields. Never assert data sync merely because matching records are visible in separate ChatGPT connectors.

## 8 — Recovery and integration execution order for Codex

**P0. Repository and branch preflight:** fetch current `main`, PR #58 mining/wallets, #61 virtual life-node protocol, #63 Airtable catalog gateway, #64 code-index integration, #65 private intake. They were separate changes at last audit; review their current merge state and conflicts before editing. Do not merge without approval.

**P1. Index exact existing app sources:** extract the full repository tree, modules, routes, HTML files, tests, code locations, version graph, licenses and open PR patches. Reuse the existing `build-recovery` atlas and Factory build order; no rewrite of earlier products.

**P2. Inventory all permitted connected-source metadata:** Notion pages, Airtable tables/records, Drive items/versions and GitHub code, with source IDs, timestamps and evidence. Page search results are pointers, **not** bytes. Do not claim source completeness without pagination/coverage checks.

**P3. Recover owner-controlled bytes:** accept the 12-file recovery pack and any additional authorized ZIP/CSV/JSON, code, manuscripts, images, diagrams and other originals. Hash, count, verify, classify and keep a re-importable archive manifest. Never push the owner files to public GitHub.

**P4. Catalog every data type separately:** books, lexicons/scripts/RTL-LTR mirror formulas, A–Z acronyms, creative concepts, games, design imagery, history, theology, science, genealogy, math and anatomical reference models, security/docs, code, hardware, crypto and AI-node references. Distinguish creative/speculative content from verified fact and operational software.

**P5. Build searchable navigation:** unify the *index* across Nathan AI, ONE, Factory and independent products. Preserve the original directory, source links, direct module launch routes and per-source status. Add search facets for source, date, language, privacy, lifecycle and unresolved issues.

**P6. Integrate permitted data pipelines only after authentication design:** design narrowly scoped GitHub, Drive, Notion, Airtable and Datadog adapters. Store tokens on a secure private backend only, encrypt and rotate, enforce deny-by-default authorization, audit every import and provide revoke/reconcile controls. Static GitHub Pages must never embed PATs, private credentials or unprotected tenant data.

**P7. Crypto and hardware verification:** mining providers require observed device/pool telemetry, hashrates, energy and payout sources; public receiving addresses alone do not prove ownership. No private wallet keys or transfers; keep test/simulation and real assets distinct.

**P8. Validate and deploy cautiously:** verify duplicate preservation, no source mutation, auth isolation, exact bytes, fail-closed permissions, route functionality, accessibility, restore tests, offline behavior, mobile/browser checks, security scanning and current CI. New PR-specific CI success does not override a failing Factory suite.

**P9. Report coverage truthfully:** number of files and bytes actually recovered, unique content hashes and source versions, outstanding archives, unknown-source items, conflicts, missing connector permissions, unverified PRs, live deployment evidence and next approved steps. A task is complete only when supported by actual observed evidence.

## 9 — Targeted checks

Run from repository root (Node 22+) when relevant:

```sh
node --test app-factory/nathan-ai/source-intake/source-intake.test.cjs
node --test app-factory/nathan-ai/build-recovery/atlas.test.cjs
node --test app-factory/core/root-contracts.test.cjs
node --test app-factory/one/one.test.cjs
node --test app-factory/quality.test.cjs
```

The dedicated Private Source Intake workflow for PR #65 previously passed, while the broader Factory check failed in the Universal 13 tools test segment. **Re-run/review latest status**; do not label the overall build green or assume the failure was repaired.

A further browser QA checklist must cover correct passphrase rejection; imported bytes identical on restore; metadata manifest excluding ciphertext; duplicates and changed versions; folder traversal; large-file/quota handling; loss-of-key warning; XSS-safe previews and filenames; no network transport of source bytes; mobile IndexedDB and backup/restore.

## 10 — Codex deliverable policy

Maintain a machine-readable evidence inventory *in approved private storage* and a sanitized public source map in GitHub. For each work request, provide:

1. Exact existing sources examined and which were unavailable.
2. Distinct code/metadata changes and preservation of unrelated modules.
3. Tests and observed results, with commit/PR and branch.
4. Classified source counts with proper grain; missing/backlog/duplicate exceptions.
5. Privacy review confirming no new private bytes or credentials were committed.
6. Outstanding approvals and the shortest verified next implementation step.

**One front door to the whole ecosystem, many separate originals. Preserve → Index → Relate → Derive. Never replace.**

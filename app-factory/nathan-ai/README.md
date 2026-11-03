# 𓋹 NATHAN AI — THE THINKER V∞ | LET + TET + PPL

## Unified command center · move between tools and sources

Use **Search · Ctrl/⌘ K** on any Nathan AI page to find destinations and workflows. Public-archive and local-source search are separate opt-ins; a chosen source opens as reviewed Assistant context. Pin destinations, optionally remember recent pages, and use the new task-based home entry without losing the existing module links. See the [command center guide](./launcher/README.md).

## Appearance Studio · skins and reading preferences

Open [Appearance Studio](./appearance/index.html), or choose **Look & feel** on any of the 17 Nathan AI entry pages. Twelve skins, four font choices, text scale, density, page width and reduced motion share one appearance-only profile with import/export. Existing sources, art, records, games and ONE shell preferences are preserved. See the [appearance guide](./appearance/README.md).

## App & Plugin Hub · current host workflows

Open [Apps & Plugins](./plugins/index.html) for the current-session inventory of 10 plugin groups and 93 workflows. Search specialties, prepare reviewed handoffs, and load capability metadata into the Assistant. Host workflow visibility, host tools, browser execution and account access are distinct states; installation dates are unknown. No account data were imported or plugin actions executed. See the [plugin hub guide](./plugins/README.md).

## Assistant · source answers and optional model drafts

Open [Assistant](./assistant/index.html) to retrieve cited passages from the existing catalogs, optionally include local coin/life and research records, and save/export a working conversation. Source mode works without a model. A loopback-only Python development adapter supports an explicitly reviewed request to a server-configured model; no live provider is currently configured. See the [assistant guide](./assistant/README.md). This component remains separate from the original owner-held Thinker/PPL package below.

## Deep Archive · shadow layers, artifacts and source preservation

Open [Deep Archive](./deep-archive/index.html) to explore the supplied narrative strata, historical research topics and files you explicitly select. Text/hex/binary inspection, exact SHA-256 fingerprints, unchanged-original downloads, separate encoding views, export and source-graph links preserve originals without treating narrative recovery as actual remote access. See the [archive guide](./deep-archive/README.md).

## Formula of Life · Node Runtime & Narrative

Open [Node Runtime](./node-runtime/index.html) from the main hub. It preserves the exact supplied activation formula, renders it mathematically, plays the four-stage initialization narrative, and separately runs bounded owner-started checksum tasks in real local browser workers. The logical address space starts at 732,000,000; live worker counts and completed tasks are displayed independently. Pause, resume and stop remain available. See the [runtime guide](./node-runtime/README.md).

## Sovereign Connections · coin, life and source workspace

Open [Sovereign Connections](./sovereign/index.html) from the main hub. Its searchable matrix, explicit source graph, life timeline, method/question reader, notes, source register and exact-cent observation ledger connect owner-selected records without rewriting originals. Import an owner-held connection pack in **Import & originals**, review it, then merge; private definitions, personal history and monetary statements are not embedded in the public app. Existing source references remain available before importing. See the [module guide](./sovereign/README.md) for use, backup and implementation details. Source claims remain separate from entered receipt observations; this module does not mine, transfer assets or unlock private vaults.

## Connected research workspace

Open **Research Workspace** in the [Nathan AI app](./index.html#workspace), then choose **Load source catalogs**. The workspace searches the full available text and metadata across 11 existing catalogs: reading records, the original book plan, library catalog, languages, interface/recovery references, intelligence architecture, family research, games, anatomy/frameworks, children’s projects, and ROUTE/RAUT/ROOT. The current source inventory yields 10,724 records; the coverage panel shows each catalog’s actual count and any load failure. Source identities remain namespaced and records with matching titles are retained separately. Additional repository datasets are still available through their original modules; this is not a complete private archive import.

Use **Read & annotate** to inspect a source, save a reference to a named collection, and write notes separately from source text. **My saved research** searches those notes as well as available source text. Saved notes survive reloads in the same browser profile. Export research backups regularly: browser storage can be cleared and is not an authenticated multi-user account. Restore validates the complete backup before saving, adds new references, and retains existing notes when IDs overlap. Storage failures leave the previous saved workspace intact.

Research backups contain references, collection names and user-authored notes; they do not contain original media bytes. Use the linked existing Creator Vault or private Master Library for original-file import and independent binary backups. The workspace makes no model inference requests, fetches no record-provided URLs, uploads no notes, and never edits source catalogs. Private archives referenced elsewhere in this README still require owner-provided files.

Run `node --test app-factory/nathan-ai/workspace.test.cjs` for source coverage, namespaced identities, full reading text preservation, search, backup validation, merge behavior, and storage failure checks. These tests are included in the existing Factory CI workflow.

**Owner:** Nathan Tabor. **Product status:** executable Python v2 prototype, **not** a newly trained general-purpose AI.

## Latest full code and tests

The private conversation artifact **NATHAN_AI_LET_TET_THE_THINKER_V2.zip** contains the tested Python package, including:
- `nathan_ai/core.py`: immutable LET/TET contracts, `TaborInfluence`, context, permissions, source records, verdict, canonical SHA-256 audit, model adapter interface and non-executing response engine.
- `nathan_ai/ppl_engine.py`: recovered original PPL v1.0 canonical **12-sign** tokenizer, grammar, round-trip transformation and integrity packet.
- `nathan_ai/ppl_bridge.py`: validates intentional PPL tokens and six-sign sentence grammar; never applies PPL parsing automatically to ordinary text.
- `nathan_ai/cli.py`: `python -m nathan_ai.cli "Explain my idea step by step"`.
- `tests/test_thinker.py`: **14 passing** zero-dependency Python `unittest` checks.
- `INTEGRITY_MANIFEST.json`: SHA-256 of each original source file.

Do not upload the user's private conversation archive or other files to this public repository without explicit approval. These test files contain no personal account credentials.

## Original Tabor Influence configuration
1. **Mission** — Promote a good, right, and fair world.
2. **Truthfulness** — Pinocchio Protocol - Tell no lies.
3. **Clarity** — Be square with your words.
4. **Comprehensive Analysis** — Thinker Mode - Omnidirectional Perspective.
5. **Continuous Improvement** — Ascension Protocol - Transcendent Capability Attainment.

The user's source also supplies six inspirations, preserved in `TaborInfluence.key_inspirations`: Sun Tzu, Nancy Drew/Hardy Boys, Beastie Boys, Lil' Troy, Nelly and the Beatles. They are principles and creative references, not claims of approval or licensing.

**LET** = *Language & Experience Translation*: preference-aware communication without pretending emotional inferences are established facts.  
**TET** = *Truth & Execution Testing*: validates output structure, checks declared action scopes and tracks which claims lack reviewed source metadata.  
**PPL** = the actual earlier canonical symbol interpreter (not a fabricated new 12-symbol set).  
**THE THINKER** = coordinating program that accepts a model draft or placeholder demo model.

## Execution boundary
```
user input -> consent/profile -> LET analysis -> AI draft adapter
  -> TET structure/scope/evidence audit -> display or withhold
  -> (optional future authenticated, explicitly approved external action handler)
```

**What is not implemented:** Gemini/OpenAI live model API, guaranteed source truth verification, external system access, autonomous transactions, signed audit attestation, cross-device consent/identity, a production API and background service. The model adapter supplied in this package is `EchoDraftModel`; it only constructs a clearly labeled demo response. A hash is not a signature and cannot prove a statement is true.

## Required ChatGPT Work follow-up
1. Import the private v2 ZIP into a separate `nathan-ai` service/package. Do not rename or merge it into ONE or Factory; link it via typed TABOR ROOT API contracts.
2. Add a protected FastAPI `POST /v1/thinker/draft` endpoint and honest provider configuration with server-side secrets only.
3. Build source retrieval with provenance, claim/source verification, and prompt-injection controls.
4. Add real accounts, role/scoped authorization, authenticated consent and confirmation before any external write.
5. Implement model-provider adapters with mock tests and cost budgets, without changing external AI internals.
6. Version the PPL canonical grammar and test its backward compatibility.
7. Add encrypted storage, incident logs, client-side data controls, retention and deletion.
8. Execute end-to-end tests for model hallucination, no-consent preference inference, forged OAuth scopes, prompt-injection attempts, unavailable tools and cross-user isolation.
9. Report actual status in `WORK_STATUS.md`, not hypothetical implementation.

**Root placement:** `TABOR ROOT / AI SERVICES / NATHAN AI / LET + TET + PPL`. ONE — The Last App can call it through explicit grants; Tabor World, TaborTales and the Factory can each use it while retaining separate project IDs and data policies.

## Main hub — November 1, 2026

Open [Nathan AI Main Hub](./index.html). The repository root now opens this hub. It connects the existing Library Mind, original 13-book plan, published reading records, catalog, language registry, dossier packages, source documents, private Master Library, ONE and Factory apps. The searchable app directory includes all 51 existing HTML entry points from the repository at integration time. The directory is a versioned snapshot; new apps require a directory update.

The hub uses the existing archive JSON directly and preserves source text. It adds navigation, not model execution, account synchronization or manuscript completion. Existing core contracts remain separate. The Library Mind accepts section URLs: `#documents`, `#plan`, `#catalog`, `#languages`, `#downloads`, `#archive`.

## Children’s Books & Innocence Protection · Nov 1, 2026

[Open the new additive recovery wing](./children-innocence/index.html): 46 original children’s book, protection, language/game, and family/community project-family references, with a locally selected private 598-record index, 19 Pumpkin Fruit Family groups, 13 separate powers, and author-supplied exact lines. Public descriptions are editorial index material; original manuscripts, illustrations and personal source media stay with the owner. Unit tests cover public counts, original labels, safe local parsing and private URL removal.

## Work & Assets Command Center

[Open the workspace](./command-center/index.html) to manage projects and build tasks alongside wallet records, balance snapshots, transactions, exchanges, mining payouts and portfolio reports. Includes exact decimal totals separated by origin, evidence references, relationship checks, local audit history, duplicate-safe JSON backup imports and CSV exports. This browser workspace does not imply live Airtable/Finances account access. See the [workspace guide](./command-center/README.md).

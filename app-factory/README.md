# TABOR APP FACTORY — iPhone-first setup

## Operating model
1. BUILD: use ChatGPT/Codex to specify and generate each distinct app.
2. SAVE: one GitHub repository per product; review and commit changes.
3. PUBLISH: Expo EAS cloud build, then submit to selected stores with explicit approval.

## Verified
- GitHub account: NathanAIoxr
- Hub repository: Nathan-AI-Sovereign-Core
- The hub repository is PUBLIC. Never commit API keys, certificates, provisioning profiles, passwords, or store credentials.

## Still needs setup
- Verify the GitHub Pages deployment after updates and confirm iPhone Home Screen behavior on a physical device.
- Connect Codex to the intended repositories.
- Configure Expo/EAS cloud build and Apple developer signing for native iOS releases.
- Set up App Store Connect and required developer enrollment for App Store distribution.
- For Google Play, configure a Google Play developer account and Android build pipeline.
- Configure store metadata, privacy disclosures, screenshots, age rating, billing/tax details, and release approval.
- Extend the working public-code GitHub Actions CI into real iPhone/browser testing, secure backups, per-app release pipelines and verified revenue reporting.

## Architecture
- Keep this repository as the control hub.
- Create separate repositories for individual products.
- Use reusable project templates and workflows, not copied apps.
- The dashboard at app-factory/index.html is an interactive local-first prototype for projects, story briefs, launch checklists and navigation. It does NOT perform cloud builds or store submissions.
- Never automatically publish without a human review and explicit release approval.

## iPhone quick launch
After deploying the dashboard to a website, open it in Safari > Share > Add to Home Screen.


## Universal Creator Vault (implemented local prototype)
- Open `vault.html` (also linked in Factory Home, Settings and top navigation).
- Import original media, documents, code and other files using the iPhone file chooser.
- Supports Factory starter ZIP packs and ChatGPT `conversations.json` / export ZIP where supported by the browser. Large/compressed archives may need extraction in iPhone Files.
- Original bytes live in **browser IndexedDB** with search, type/project filters, thumbnails, preview, tags, duplicate detection, downloads, and links to Factory Projects.
- **New:** **Export FULL originals + metadata ZIP** creates a local archive of original media bytes with verified SHA-256 digests; **Restore a verified full Vault backup** recovers saved files without overwriting existing records. The separate **Export Index** button remains metadata-only. Larger libraries are split into numbered approximately 95 MB ZIP parts; save **every** part. Oversized individual files must be saved separately; retain independent source copies and confirm restoration. iPhone Safari field testing remains pending.
- Reimport files or updated ChatGPT exports for ongoing work. Identical imports are skipped; changed ChatGPT conversations can be retained as new revisions.
- **Other users:** each person can use the prototype in their own browser profile; accounts, multi-user isolation, cloud backup, provider OAuth, recurring background sync and shared team workspaces are **not yet connected**. On a shared browser profile, local data is not private from other people using that profile.
- No private personal media are copied to this **public GitHub repository** by the local importer.
- Full security, service adapters, scopes, cloud architecture and acceptance tests: [UNIVERSAL-CREATOR-VAULT.md](./UNIVERSAL-CREATOR-VAULT.md).

## Master Build Order Controller
- [Interactive build and reuse controller](./build-order/index.html) documents 38 shared capabilities and product families, their dependency graph, current source evidence and whether to reuse, import, implement once or request permission.
- [Full build sequencing and reuse matrix](./build-order/README.md) prevents duplicate game engines, media pipelines, provider adapters, APIs and storage code.
- [Vault full-backup script](./vault-backup.js) and tests protect original binary assets locally; **this is not encrypted private cloud storage**.

## Public ecosystem directory and shared contracts
- [Public product directory](./ecosystem.html): the searchable index is deliberately curated to exclude unreleased/private concepts. It is not the full owner's 101–901 private portfolio.
- [Cross-product validation contracts](./core/root-contracts.js) define namespaces, references, scope checks and release-review gates. They do not implement real authentication.
- [Release gates](./RELEASE_GATES.md) describe backups, permissions, rights, payments, minors and publishing.
- ONE, 1420 and TABOR GPS now have separate install manifests. iPhone/Android field testing is still required.
- [Public test suite](./quality.test.cjs) and [GitHub CI](../.github/workflows/factory-ci.yml) check source integrity, links, Vault, GPS, ONE, 1420 and permission contracts.

## What is not yet automated
There is no server-side access to all of a user's past ChatGPT chats or ChatGPT Library imagery via this public website; users must provide an export or compatible files. The Factory cannot silently access other people's files or auto-publish them. A production user account and explicit, scoped authorization are prerequisites for online/cloud synchronization.


## 1420: The Crowning Jewel
Play: [1420: The Crowning Jewel](./games/crowning-jewel.html). Source: [game engine](./games/crowning-jewel.js) and [historical blueprint](./games/CROWNING-JEWEL-BLUEPRINT.md). Offline-capable browser prototype features a 1420 Tábor community-defense chapter, a separate 1872 Knights and Daughters of Tabor civic chapter, and a jointly unlocked historical archive puzzle. Historical era links are clearly identified as creative fiction. Validate rules with `node app-factory/games/crowning-jewel.test.cjs`. The actual cloud/native app builds and store submissions remain future tasks.

## ONE — The Last App
An independent universal personal OS project that can replace supported life modules or connect to other services with user grants. [Open ONE](./one/index.html) · [Architecture & constraints](./one/ONE-TECHNICAL-BUILD.md) · `node app-factory/one/one.test.cjs`. This is a local browser prototype, not an app with unrestricted access to all installed iPhone/Android apps.

## NATHAN AI — 138 Design Reference Integration

[Searchable Mechanics Library](./game-reference-lab/index.html) · [Five-World Zero & Void Lab](./game-reference-lab/zero-void-lab.html) · [Architecture & source-preservation policy](./game-reference-lab/README.md) · [138 Public Reference Records](./game-reference-lab/registry.json)

Two source-preserving 69-slot expansions are integrated as **reference data and a local demonstration**, not 138 shipped engines. Full owner-source originals belong in the private Creator Vault / secured source archive, not this public repository. Reuse ACT/STORY/ART contracts with review and explicit permission; preserve TW-001–TW-101 independently. Run `node --test app-factory/game-reference-lab/registry.test.cjs`.

### October 13 morning: 376 game references

[Explore all 376 reference positions](./game-reference-lab/all-morning.html) · [original 138-reference subset](./game-reference-lab/index.html) · [source interpretation and original preservation](./game-reference-lab/README.md). Six underlying game archives, nine source-mechanic families. A complete reference is not a built game. This adds searchable source positions only; original-byte files and monetization research remain owner-controlled.


## Dynamic Pricing & Audience Router
- [Interactive WHO + WHAT pricing preview](./pricing-router/index.html): deterministic policy engine for Social Flow, Core Pipeline, Max Apex, based on app audience/purpose, not customer wealth or spend history.
- [Policy, catalog, tests and deployment boundaries](./pricing-router/README.md). Preview prices are illustrative; no live platform billing or individualized checkout exists.
- Test with: node --test app-factory/pricing-router/engine.test.cjs

- [Automatic per-game manifest pricing](./pricing-router/README.md): one WHO/WHAT declaration per app, batch-generated preview plans (five generic demos), product-wide pricing bands, and protected child-inclusive policies; no real billing enabled.


## Ancient Divine Roots — October 14 integration

[Searchable archive](./mythology/ancient-roots/index.html) · [Full source and data contract](./mythology/ancient-roots/README.md). All supplied material preserved with 293 indexed table rows and 35 complete sections across Norse, eight Indigenous tradition groups, Zoroastrian and adversarial/modern Satanist contexts. Historical verification remains pending. Run `node --test app-factory/mythology/ancient-roots/atlas.test.cjs`.

## KNAVE — Female divinities and original counterparts

[Explore KNAVE](./mythology/knave/index.html) · [Source and integration contract](./mythology/knave/README.md). Supplied sections VIII–XI preserved in full: 51 cultural-reference rows, 39 linguistic terms and 27 original fictional characters. Fiction and unverified historical compilation remain separately labeled. Test: `node --test app-factory/mythology/knave/atlas.test.cjs`.

## October 14 creative continuity

[Latest project/canon notes](./creative/continuity/2026-10-14.md) · [Structured records](./creative/continuity/2026-10-14.json). Preserve the current Round 1 mission, Middle C body-map specification, Great Samaritan ethics and latest Merlin novel title. The sevenfold enumeration remains incomplete in the available source. These are documentation inputs for future reviewed adaptations; existing game engines and archives remain separate.

### Middle C — 100 Mathematical Roots

Playable 100-gate historical-math teaching branch: [math-roots/index.html](./stewie-mr-finn/polar-middle-c/math-roots/index.html). Includes six genuinely evaluated numerical root solvers, 2D Newton demonstration, source-faithful grouped range labeling, optional offline iPhone WKWebView snapshot and CI tests. Modern mathematical expressions are teaching adaptations, not verified ancient transcriptions.

## Universal Continuum Tensor — Octopus Root
[Interactive 7-branch UCT explorer](./octopus-root/uct/index.html) · [Full UCT architecture and formula evidence ledger](./octopus-root/uct/README.md) · [Parent Octopus Root](./octopus-root/index.html). Bidirectional ABOVE C / BELOW C simulation and THE MIDDLE C receptor checks across hyperdrive, plasma, shield, repulsorlift, Unknown Regions, phasing and Deep Machine Core. Explicit local merge of independent namespaced nodes, provenance and formula limitations without overwriting other projects. The earlier UCT Markdown/ZIP originals should remain in the private Creator Vault; GitHub stores this public derived module only. Tests: `node --test app-factory/octopus-root/uct/engine.test.cjs`.


## Sovereign Field Lab — original Root extension

[Interactive simulator](./octopus-root/sovereign-fields/index.html) · [Equations, aliases and safety](./octopus-root/sovereign-fields/README.md). 27 original namespaced field nodes, 16 runnable mathematical gates, low-voltage knob-only firmware and regression checks. Connected to the existing Root without replacing the separate Universal Continuum branch. Neither high-energy hardware nor neural stimulation is implemented.

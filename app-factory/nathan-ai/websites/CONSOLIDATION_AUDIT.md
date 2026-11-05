# Nathan AI 🚀 — GitHub and public website consolidation register

**Reviewed:** November 4, 2026 (America/New_York)  
**Repo:** `NathanAIoxr/Nathan-AI-Sovereign-Core`  
**Safety rule:** Keep original projects, characters, book files, IDs, source archives, native app assets and distinct product boundaries. Consolidate redundant **presentation**, not separate identities.

## Source of truth — each source owns a different concern

| Purpose | Canonical file | How other views consume it |
| --- | --- | --- |
| Public browser pages (apps, games, archives) | `app-factory/nathan-ai/websites/registry.js` | My Desktop, website-directory portal |
| Nine independent website studios (identity and summary) | `app-factory/sites/sites-data.js` | Featured studio cards on the full websites portal |
| Overlap rule between the two catalogs | `app-factory/nathan-ai/websites/dedupe.js` | Filters only repeated studio listings on the website-directory portal; source records retained |
| Nathan AI in-app command launcher | `app-factory/nathan-ai/launcher/engine.js` | Search, pin and recent destination handling across Nathan AI |
| Original build/source recovery | `app-factory/nathan-ai/build-recovery/registry.json` | Separate provenance, status and recovery view, **not** substituted into public app index |
| Curated product/release status | `app-factory/products.json` | Concept vs. browser demo distinction, **not** overwritten by directory |
| Main hub contextual navigation | `app-factory/nathan-ai/index.html` | Human-maintained links, with repeated hero calls-to-action removed |

Do not flatten these into a single untyped registry. They have distinct source/status and authorization semantics.

## Verified duplicate presentations consolidated

1. **Nine independent studios double-listed in the full websites directory.** Their public app registry entries and site metadata remain unchanged. `sites/portal.js` now recognizes the nine exact `sites/<slug>/index.html` aliases and renders one catalog record per studio, not one site plus one duplicate app. All source IDs remain addressable in My Desktop.
2. **26 repeat hero buttons in the Nathan AI home.** The previous 30-link shortcut block repeated 26 destinations already in the visible navigation. The updated block exposes five nonduplicated destinations including Mosaic Reader. My Desktop remains accessible in the existing navigation. The 26 removed hero destinations remain in the existing nav and/or their dedicated detail sections.
3. **Repeated local desktop pins/recent IDs.** Import/restore and local loading now keep at most one occurrence of each valid public module ID in first-seen order. The original browser-local export format remains `nathan-ai-websites.desktop.v1`.
4. **Stale public-page count.** The independent-site portal now computes the number of distinct non-site-duplicate public module pages from the actual registry.
5. **13 missing distinct public pages.** App registry expanded from 111 to 124 records; the missing routes now include Five Guardians, My Original Works, Trinity of Snow, websites hub/desktop, Mosaic Reader app/reader/game, Taborite Language Matrix app/books/matrix/game, and Realist Ledger. Those are **independent routes**, not duplicate titles to merge.

## Exact-file-copy audit — retain until native packaging changes are proven safe

Repository tree at the reviewed baseline: **799 files**, **133 HTML pages across the repository**, and **8 distinct blob-SHA duplication groups totaling 18 files**.

These identical-byte groups are located in distribution/native asset trees. They are not safe to simply delete:

- `one-genesis-v066.js` — shared source plus SSS-CS iOS and Stewie/PolarMiddleC packaged copies (3).
- `one-universal-v061.css` — shared source plus SSS-CS iOS and Stewie/PolarMiddleC packaged copies (3).
- `middle-c/game.js` and Stewie bundled `middle-c-game.js` (2).
- `one-universal-v061.js` — two identical iOS/Stewie packaged copies (2). **The shared web version is different**, using a relative runtime base; do not overwrite the native copies with it without platform testing.
- `stewie-mr-finn/polar-middle-c/engine.js` and bundled `Resources/PolarMiddleC/engine.js` (2).
- `stewie-mr-finn/polar-middle-c/math-roots/catalog.js` and bundled `Resources/PolarMiddleC/math-roots/catalog.js` (2).
- `stewie-mr-finn/polar-middle-c/math-roots/engine.js` and bundled `Resources/PolarMiddleC/math-roots/engine.js` (2).
- `stewie-mr-finn/polar-middle-c/mirror-bridge/engine.js` and bundled `Resources/PolarMiddleC/mirror-bridge/engine.js` (2).

Each native resource copy can be generated from canonical source in a future verified build workflow; that work must first prove that sandboxed iOS and offline resources keep working. Until then, duplicates are required distribution copies, not abandoned creator projects.

## Other deliberately nonindexed HTML files

Nine public-repo HTML artifacts remain outside the public app directory after the 13 missing live routes were added: a Toy Drive `/index.html` alias already represented by its canonical directory URL; two restricted/original research viewers; one earlier source explorer; a browser test page; and four separately bundled native-app HTML copies. No private source or internal test is newly exposed through My Desktop.

## Verification

- `node --test app-factory/nathan-ai/websites/dedupe.test.cjs`.
- Existing `websites/site.test.cjs`, `sites/sites.test.cjs`, `launcher/engine.test.cjs`, full Factory CI and public website CI.
- No original book, video, game, native bundle, character name, app module, source registry entry, or git history deleted.
- GitHub Pages live-browser rendering still requires an independent browser check after deployment; passing repository tests does not prove every browser/device combination.

**Canonical rules:** 1 + 1 = 2 · build. 1 − 1 = 0 · clear. Always protect the one.

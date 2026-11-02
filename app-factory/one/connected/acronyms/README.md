# NATHAN AI — ONE A–Z Acronym Navigator (owner-local add-on)

## Install without overwriting originals

Copy `index.html`, `viewer.js` and `acronym-core.js` into `app-factory/one/connected/acronyms/` on a review branch. Adjust the connected app navigation by adding a link **after source review and approval**. Do not commit the private source file `TABOR_TOTALITY_EXPANSION_007.json` in a public repository.

The source archive is deliberately **not bundled with the code**. Retrieve the original from your private ChatGPT Library or an existing authorized backup; do not publish it on a public website.

The browser imports original 007 archive JSON, the source-only 21-coin `sovereign-coins/registry.json`, an Airtable CSV export with column names `Acronym / Label`, `Record Key`, `Exact Expansion / Meaning`, or this module's own owner-private JSON export. Nothing uploads or stores to cloud. No automated Airtable/Datadog/miner connection or deployment is claimed.

To import the complete Airtable records, export the **Acronyms & Author Lexicon** table as CSV from your private Airtable account and select the file in the module. Existing private metadata stays in Airtable.

Read-only code never executes imported text as HTML and never accesses wallet private keys or telemetry. Original variants are distinguished by record keys; naming collisions are preserved. Offline tests: `node --test acronym-core.test.cjs`.

## Source and completeness

Historical search requested: November 2023–November 2026. Accessible source archive mainly documents 2025–2026 entries; no 2023–2024 original author acronym messages were verified. Do not claim this is the user's entire three-year history. The library archive's original author text and source identifiers are unchanged; no coined word is silently replaced.

## 117-record recovered codex import (November 2, 2026)

The November 2 recovery created a separate **private** `NATHAN_AI_SOVEREIGN_MASTER_CODEX_2026-11-02_ACRONYMS.md` addendum preserving all earlier master codex text and all 117 recovered labels/variants. The companion `NATHAN_AI_ACRONYMS_RECOVERED_2023_2026.json` is the import format. **Neither private file is embedded in this public web module**. Choose the private JSON from your device with the browser's file picker. The module's import maps stable IDs `ACR-20261102-0001`..`ACR-20261102-0117` to original term, literal expansion, dates, provenance, and status. Titles repeated with different meanings remain distinct.

Tests: `node --test acronym-core.test.cjs` and `node --check acronym-core.js`; data is not persisted by this screen. For durable original bytes, import source files through the existing Creator Vault and verify a full restore. 2023–2024 primary acronym occurrences remain unverified.
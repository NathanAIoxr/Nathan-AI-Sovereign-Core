# Nathan AI 🚀 — Games, Puzzles & Original Source Atlas
**Date:** 2026-11-01 · **Owner:** John Nathan Tabor
**Location:** `app-factory/nathan-ai/games/`
**Live page:** [Games & Puzzles Atlas](./index.html)

This is an **additive** doorway in the existing Nathan AI Main Hub and ONE ecosystem, not a replacement for an existing game or a claim that 101 games or 909 toys have shipped.

## What is included
- `catalog.json` — public title-level index of known game worlds, puzzles, language engines, holiday championships, learning games and physical game concepts. Every entry has a clearly labeled development stage. A link is only supplied where an existing repository route is known.
- `atlas.mjs` — searchable, category-filterable display; local IndexedDB archive of owner-selected unmodified source text; derived bullet-line search; read/export/delete controls.
- `index.html` — mobile-friendly front door, source-first labels and clear privacy boundary.
- `atlas.test.mjs` — tests for packed source parsing and exact source preservation.

## Import the owner source pack
1. Obtain `Nathan_AI_Games_Puzzles_Owner_Source_Pack_2026-11-01.json` from its owner's conversation file. This pack is **not** bundled in the public repository.
2. Open the atlas and select that file in the owner-source import control.
3. Source documents are copied to the current browser's IndexedDB. They are **not sent to GitHub**, the Factory, a server, or other users.
4. Search derived source entries, inspect any original document, and export an unchanged text copy.
5. Back up sources securely. IndexedDB is not encrypted and a browser reset can remove data.

Pack schema: `nathan-ai-games-pack.v1`, with a `files` array of `{name, content, source_kind, sha256_utf8}`. Each `content` is the complete original Unicode text. The app does not interpret imported text as HTML, JavaScript, Python or commands.

## Canon and status
- 1+1=2 BUILD; 1−1=0 CLEAR.
- Original authored source, derived indexing and assistant descriptions remain separate.
- Private prototypes, ideas, references, proposed mechanics, and released browser demonstrations are not interchangeable stages.
- Other product namespaces (ONE, TABOR WORLD, TABOR TOY COMPANY, TaborTales, LET/TET, original manuscripts) remain independent behind the shared hub.
- Historical claims in recovered puzzle lore and third-party names require individual verification/rights review before educational or commercial use.

**Testing:** `node --test app-factory/nathan-ai/games/atlas.test.mjs`.

**Not included:** conversion of private original ZIP code to deployed engines; a live backend; secure multi-device account synchronization; deployment of iOS binaries; 101 new working games; importing anything without the owner's local file selection.

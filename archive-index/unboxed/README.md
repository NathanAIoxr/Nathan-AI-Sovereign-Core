# NATHAN AI — UNBOXED Source Restoration Explorer

**Operating principle:** Preserve → Index → Relate → Derive; Never Replace. 1+1=2 BUILD · 1−1=0 CLEAR.

## Why this exists

The 416-entry Paradox / Enigma Atlas is not the full owner archive. It cannot stand in for the user's existing sources. This **additive** explorer exists to restore *discoverability*, not overwrite manuscripts, flatten source stages, or invent lost content.

**This release does not claim to have downloaded or reconstructed missing private originals.**

## Verified/reconciled existing sources

| Source | Confirmed recorded scale | What it actually measures |
|---|---:|---|
| `archive-index/2026-11-05/` | **5,964 files / 139 folders** | 6,103 owner-library metadata entries (not all bytes accessible) |
| `archive-index/loc-b8/` | **19,317 subject-classified source items** | Owner-controlled organized catalog; 21 provisional subject classes, not 19,317 finished books |
| B / 8 same catalog crosswalk | **5,851 linked records** | Cross-reference links, not extra original items |
| Historical Totality source catalog | **6,056 source rows** | Separate prior registry; overlaps sources, not complete publications |
| `app-factory/one/library-mind/languages.json` | **7,918 language profiles** | Reference profiles, including non-individual and unreviewed entries |
| `app-factory/one/library-mind/catalog.json` | **2,193 records** | Public catalog entries; distinct from manuscript texts |
| `app-factory/one/library-mind/documents.json` | **55 document records** | Available document bodies/stages; not all creator-authored |
| `app-factory/nathan-ai/program-jobs/catalog.json` | **357 records** | Overlapping stage/evidence records, not 357 finished apps |
| `app-factory/nathan-ai/hop-in/paradox-atlas/atlas.json` | **298 reference leads** | Research prompts, not user originals or independently validated paradoxes |
| `app-factory/games/paradox-118/roster.js` | **118 character identities** | Original fictional creator canon |
| `repository-tree.json` | **1,023 source file paths** | Git blob SHA, path, byte size and GitHub source link, frozen at tree revision |
| `archive-index/letter-a/source-catalog.public.json` | **376 public source-metadata rows** | Privacy-gated subset of 381 original A title rows |

**Do not sum these counts.** Different catalogs, records, references, versions, files, catalog classes, languages, titles, and independent works are not equivalent.

## What the explorer actually does

- Loads existing GitHub source-path records, owner-file **metadata**, ONE language profiles, ONE document bodies, program evidence records, A-title source metadata, game index, original-works manifest and paradox research leads separately.
- Uses a searchable, open-ended source table, **not a forced exclusive taxonomy**. Searches can match multiple interests at once without rewriting the original fields.
- Exposes each source's raw record and any body present in that record. All rendered user-controlled source text is inserted via `textContent`; never interpreted as active HTML.
- Supports browser-local owner-selected JSON, JSONL, CSV, TSV and text/source imports. ZIP and SQLite are indexed as original binary files; they are not executed or extracted by this browser.
- Local import bytes stay in the open browser tab. An original owner-selected file may be downloaded again without modifying the source; the app deliberately creates **no browser persistent storage** for originals.
- Exports filtered **metadata only**, not private text/bodies; private metadata export requires a confirmation.
- Preserves repeated names and versions in their own source collection and row position. Titles, identifiers, catalog stage and original fields remain visible. Source-view status does not imply validated authorship, scientific truth, or production readiness.

## How to open

Serve the full repository root with `python3 -m http.server 8765`, then open `http://localhost:8765/archive-index/unboxed/`.

Start by loading repository files, document bodies, languages, owner-file index, and other public catalogs as needed. To search unpublished originals, import the owner-held catalog or source files with the on-page file picker. Originals are **not** uploaded to GitHub or a remote model.

For ZIP members, SQLite databases, image pixels and extended file inspection, use the existing read-only inspector at `archive-index/2026-11-05/inspect_originals.py` with an owner-selected directory. Large files above 15 MiB are indexed without their full content, never silently truncated.

## Unfinished recovery

- Private owner catalog original ZIP / file contents for the 19,317 subject-source rows are not public in the repo; one cannot convert pointers into manuscript bodies without those originals.
- No complete scan of all prior ChatGPT conversations, external devices, external git repos or closed user Library records.
- Original archives' internal members, every database value and historical version need owner-selected read-only inspection and cross-referencing.
- No deduplicating solely by title or flattening multiple stages; formal crosswalks require stable original IDs/hashes.
- Broader source-by-source thematic mapping needs review to avoid treating a keyword as authorship or proof.
- Multi-device synchronization, encrypted owner vault and richer relationship graph not implemented by the browser.

```sh
node --test archive-index/unboxed/core.test.cjs
```

The index adds new files; it never mutates or republishes private original source bytes.
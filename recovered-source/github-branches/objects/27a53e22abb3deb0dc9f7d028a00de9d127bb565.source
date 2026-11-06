# Nathan AI — existing subject catalog and B / 8 discovery integration

The existing November 5 Library of Congress-style catalog files **19,317 recovered source items across 21 subject classes**. This additive module crosslinks **5,851 B / 8 / inversion candidates** to those existing shelf IDs. It creates no duplicate physical source items. All 5,851 recovered record hashes match their existing classified source bytes, and all 19,317 classified source hashes were checked after packaging.

## Browse

Open `index.html` through the repository's static site. The public view shows aggregate shelf counts and review categories. To browse individual sources, select `04_B8_DISCOVERY_CROSS_REFERENCES/owner-catalog.json` from the organized owner archive. Import stays in the browser session; source files are not uploaded. Search the whole imported catalog or the B / 8 subset, filter by subject, original work status and review state, and export review notes. Review notes can persist in this browser's local storage; the full catalog is not stored there by this tool. Use a trusted browser/device for private sources.

The original subject shelf **B** remains philosophy/psychology/religion. A title beginning B can belong to any subject. Spelling, script, mirror/rotation, numeric-eight and double-loop candidates retain separate match labels. They do not establish a common pronunciation, etymology or meaning.

Original completion status and next action are preserved. `REVIEWED` in this interface means the catalog entry was reviewed; it does not mark a proposal, chapter, book or app complete. Review notes are exported separately and do not overwrite the original catalog.

## Existing archive integration

- Original source payloads, IDs, titles, shelf classifications, status, priorities and SHA-256 identities remain unchanged.
- The master catalog adds B8 discovery columns. Original administrative versions are retained in the additive section.
- A source crosswalk, finding aid for each relevant subject, pointer reconciliation, original B8 recovery and four new open review tasks are added.
- **1,657** file pointers match existing pointer identities; **28** entries are folders; **2** newly discovered file pointers remain pending subject review.
- The original **31** grouped finishing tasks remain open as recorded. Four B8 review tasks are appended: candidate connections, image-only stacked circles, incidental numeric eights, and new pointer reconciliation.
- Subject classification remains provisional; no official LCC call numbers, Cutter numbers or certification are assigned.

The complete organized source archive and worklist are owner-controlled Library items. This public module contains aggregate summaries and reusable tooling, not unpublished source texts, source IDs, personal paths, Library links or raw private recovery rows.

## Rebuild with owner-selected archives

```sh
python3 organize_recovery.py \
  --catalog-zip /absolute/path/existing-catalog.zip \
  --recovery-zip /absolute/path/b8-recovery.zip \
  --output-zip /absolute/path/new-organized.zip \
  --summary-dir /absolute/path/public-aggregate-summary \
  --workbook-data /absolute/path/private-workbook-input.json
```

Output must be distinct from both originals. The script reads ZIP members without extracting or executing sources, checks each recovery record against the catalog hash, and verifies every classified source after writing. The workbook-input JSON and organized ZIP contain private source metadata; keep both owner-controlled. Only the aggregate `summary.json` and `verification.json` from the summary directory are intended for public use. Spreadsheet presentation is a separately maintained owner workbook.

## Verification

```sh
node --test archive-index/loc-b8/catalog.test.mjs
python3 -m py_compile archive-index/loc-b8/organize_recovery.py
```

Tests cover subject/title separation, original completion preservation, import validation, note identity validation, pagination and aggregate reconciliation. The archive build verified 19,317 source hashes, 5,851 exact joins and zero unmatched record identities. Browser rendering and keyboard interaction still require a browser acceptance pass.

## Coverage

The supplied sources contain 18,247 searched records and a 7,910-entry language-name/code reference. These are references, proposals, work records and overlapping snapshots, not counts of finished books. Image pixels and stacked O shapes are not comprehensively inspected. External pointers do not prove original-byte recovery. All outstanding evidence, language and visual review remains visible in the owner worklist.

## Shared-core standalone tools

Open Library Catalog at `apps/catalog/`, Project Completion at `apps/completion/`, or Backup & Restore at `apps/backup/`. Each has its own launch URL and scoped browser-app manifest. All three load the same canonical workspace markup, `catalog.mjs`, `completion.mjs`, and stylesheet. No original engine is copied or replaced. Browser app descriptors do not establish signed native or store releases.

Project evidence records retain the original task wording and acceptance requirement. Five nonblank evidence fields produce `COMPLETION_RECORDED`; the tool does not independently substantiate the evidence or rewrite source completion status.

Review backups use a SHA-256 fingerprint of original source IDs, wording, hashes and task requirements. Restore rejects mismatched catalogs and malformed/unknown entries before merging. Review text and project evidence remain separate from original records. Older v1 review files lack a source fingerprint and remain available for manual source review; they are not silently assigned to a catalog.

The universal workspace at `app-factory/nathan-ai/universal-workspace/` opens each tool and retains independent launches. Private catalogs stay in each browser session; source-matched review/evidence records can persist locally and export as JSON. Load the same owner catalog in another app to continue its saved review.

Verification for this extension: 17 new/catalog checks plus 9 existing workspace/Codex regression checks passed. A full 19,317-entry owner catalog (5,851 crosslinks, 35 tasks) passed import and exact-word backup round-trip without source changes. Browser acceptance is recorded separately in `BROWSER_VERIFICATION.md`.

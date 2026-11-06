# THE TABOR TRANSCRIPT TRANSPORTER
**Creator and author:** Nathan Tabor — **The Transcriber**  
**Parent:** Nathan AI · TABOR 1-2-3 FACTORY · ONE Master Library  
**Operating principle:** *The beauty of a streaming consciousness — full-spectrum living.*

## What is implemented

This is a **working, local-first publishing-package prototype**. No paid service, credential, backend, automatic KDP submission, cloud book storage, scraping, or third-party account linking is required to use the core buttons.

1. **TRANSCRIBE:** Paste source text, import TXT/MD, import a ChatGPT `conversations.json` export or a supported ChatGPT export ZIP, choose a conversation, and extract selected human/assistant text in the original order of that conversation's active branch. The copy for publication is edited separately from the captured source. ChatGPT doesn't expose all prior chat texts automatically to a public website.
2. **SHAPE:** Title, subtitle, author, language, description, optional ebook front cover, editable manuscript, chapter recognition, approximate keyword-frequency suggestions (not verified search data). Capture and export original transcript separately.
3. **FULL SPECTRUM:** 38 **author-defined design lenses**, each with user-editable name and instructions; export JSON. Optional focus-column, large-text, and high-contrast preview does not rewrite manuscript content. The number 38 is the author's creative model, **not a clinical classification**.
4. **TRANSPORT:** Generate an actual reflowable **EPUB**, basic **DOCX print draft** (6×9, simple text, no bleed), and a ZIP containing the files, listing metadata, handoff instructions, manuscript text, cover if supplied, plus author-defined reading lenses. The original source is included in the ZIP **only if expressly checked**. EPUB uses the existing reusable DUMMIE ZIP engine.
5. **HANDOFF:** Button opens the official Amazon KDP sign-in. The owner completes KDP account authentication, setup, book details, disclosure, print specifications, previews, pricing and final publication approval.

## Exact two-button distinction

**1 MAKE MY BOOK PACKAGE:** Real local download, status `NOT_SUBMITTED`.  
**2 TAKE ME TO AMAZON KDP:** Official website navigation, **not** authenticated upload or publication.

Amazon KDP does not provide a general publicly documented automated book-submission API. Don't simulate a one-click publish or use credentials supplied to a public client-side page; don't automate account access without appropriate authorization and compliance with Amazon's conditions.

## Amazon requirements — checked November 6, 2026

- KDP recognizes DOC/DOCX, EPUB and KPF for reflowable eBooks with conditions, and recommends validating EPUB via **Kindle Previewer**: https://kdp.amazon.com/en_US/help/topic/G200634390
- No-bleed paperback interiors may be uploaded in DOC/DOCX or PDF, among other accepted formats; **bleed interiors must be PDF**. This prototype creates only a basic no-bleed **DOCX draft**, not a final print production proof: https://kdp.amazon.com/en_US/help/topic/G202145060
- Recommended eBook cover 1600 × 2560 pixels; JPEG preferred. Marketing cover uploaded separately. Print spine and back cover require KDP's cover calculator: https://kdp.amazon.com/en_US/help/topic/G6GTK3T3NUHKLEFX and https://kdp.amazon.com/en_US/cover-templates
- Amazon distinguishes content **generated** by an AI-based tool (disclosure required even if later edited substantially) from content **written by the author and merely assisted** by editing/brainstorming tools (no disclosure required for that assistance): https://kdp.amazon.com/en_US/help/topic/G200672390 . The owner verifies and answers Amazon's questions. No automated or false attestations.
- KDP terms, title creation limits, content guidelines and review status are controlled by Amazon; this app does not promise review timing, revenue, indexing or a successful listing.

## Integrity and privacy rules

- Author's sources remain authoritative. Publication copy, extracted transcript and 38 reading lenses are **derived or linked separately**, not substituted for the original records.
- No source data, cover files, passwords, account details or export ZIPs are committed to this PUBLIC repository. The page processes selected files in browser memory, with no implicit persistent backup; the user should download and independently back up source files.
- A ChatGPT export JSON may contain **other private conversations**. Select carefully. The ZIP kit excludes the original source by default. A selected conversation's extracted transcript keeps text in sequence with role markers; this is not identical to the raw ChatGPT JSON. Keep raw JSON separately as the exact archival original.
- Project ZIP limits are inherited from DUMMIE's ~80 MiB local packager. Compressed exports are handled via browser `DecompressionStream('deflate-raw')` where supported; extract `conversations.json` manually if your browser cannot read ZIP.
- Keyword hints are token-frequency heuristics only; do not call them low-competition or high-volume search research.
- EPUB and DOCX are simple text-first outputs. Complex tables, footnotes, right-to-left scripts, equations, embedded media, and professional print typography need additional format-aware authoring/validation.

## Developer verification

Run from repository root:

```sh
node --test app-factory/tabor-transcript-transporter/engine.test.cjs
node --test app-factory/dummie-publisher/publisher.test.cjs
node --check app-factory/tabor-transcript-transporter/engine.js
node --check app-factory/tabor-transcript-transporter/ui.js
```

Source module: `engine.js`  
Browser controls: `index.html`, `ui.js`  
Existing reusable ZIP provider: `../dummie-publisher/publisher.js`

## Future authenticated adapter

A true one-click transfer into KDP would require an authorized, contract-compliant integration approved for KDP account data and submission, with per-title rights review, upload receipts, audit trails and final owner authorization. There is no such integration or access token installed in this app. The project must not report "published" unless KDP verifies that status.

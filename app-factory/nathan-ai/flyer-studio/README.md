# NATHAN AI 🚀 — Flyer Studio

**Owner:** Nathan Tabor · **Placement:** NATHAN AI → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE — THE LAST APP.

[Open Flyer Studio](./index.html) · [Main Hub](../index.html)

## What is implemented

A local-first, standalone browser creative tool **inside the existing Nathan AI Main Hub** for editing and exporting professional marketing flyers without replacing any original book, app or public source.

- Six starter templates: **NATHAN AI**, **133,333,333 Master Blueprint**, **Games & Puzzles**, **WORDS / MAGICAL MINDS**, **The Tabor Trinity** (exact named order) and **Christmas Toy Drive** (explicit project-concept labeling).
- Five themes and five vector motifs, built from native SVG shapes rather than invented photographs/people or misleading QR codes.
- Four render sizes: portrait 1080×1350, square 1080×1080, story 1080×1920 and landscape 1600×900.
- Edit eyebrow, headline, description, call-to-action text, website/URL and footer. All user text is escaped before entering SVG; there is no HTML execution.
- Working live preview, browser-local explicit Save, export/import editable design JSON, download SVG, rasterize locally and download PNG, browser print / Save as PDF.
- No external assets, third-party model calls, uploads, advertisements, payments or auto-publishing. This module does not claim an actual app-store release or live charitable donation checkout.

## Owner-word preservation

These are **editable promotional presentations**, not changes to the canonical original book manuscripts or published data. All supplied name variants and words in presets remain source-derived, distinct from more speculative promotional text. Preset target numbers for the master blueprint, book-catalog addressing and language ceiling are explicitly marked as **goals**, not books already written or languages fully translated.

Local drafts live under the browser profile key `nathan-ai.flyer-studio.draft.v1`, with no encryption or cross-device synchronization. Save design JSON and downloaded SVG separately as recoverable copies. This is not private manuscript archival storage. Do not paste private sources into a publicly shared flyer without author approval.

## Quality validation

```sh
node --test app-factory/nathan-ai/flyer-studio/flyer.test.cjs
```

The test covers static source boundaries, six source-first starter templates, format rendering, XML injection escaping, design JSON roundtrip and the Main Hub link. Real mobile/iPhone PNG export, physical printing and browser behavior remain separate device QA.

## Scope boundary

This screen does not yet offer server-side collaboration, automated QR-generation, production printer bleeds, a full vector layer editor, hosted image generation or external social-media publishing. Those require separate implementation. It generates marketing artwork on demand; it does not create, publish, validate or distribute books automatically.

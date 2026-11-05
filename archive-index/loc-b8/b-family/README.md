# Nathan AI — B family, variations, and inversions

**Date:** 2026-11-05  
**Mode:** additive discovery and catalog cross-reference. **Original source bytes and original words are unchanged.**

This is the public, source-safe B-family entry point for ONE. It adds a reusable vocabulary and a classification utility on top of the **existing** [B / 8 Library-of-Congress-style integration](../README.md), rather than creating a second physical catalog.

## Recovery already indexed

| Measure | Source-backed count | Interpretation |
| --- | ---: | --- |
| Starting with B, filenames/folders | 131 | Previous Library title/filename index |
| Starting with “The B” | 26 | Same Library index, separate entry family |
| Numbered B-associated names | 5 | Same index; numeric prefixes retained |
| All three Library groups | **162** | Filename/path entries, not unique completed works |
| B-title records including language references | **1,144** | Existing classified owner catalog |
| B / 8 / inversion candidates | **5,851** | Existing source-hash-verified crosslinks |
| Existing classified source items | **19,317** | Source records, not completed books |

The counts above are inherited from the November 5 private B Work Index and the existing [public aggregate summary](../summary.json). **This layer does not claim to rescan or re-verify all original source bytes.** The original 5,851 crosslinks and their owner-catalog identities remain canonical.

## Work-family finding aid (titles preserved as previously named)

This selection is for navigation, not a replacement for the full private source index:

- **Bark / Bite:** `Bark & Bite Operating Mode`, `Bark Means Back Off!`
- **Barnabas:** `Barnabas` original-and-catalog collection; author-locked and owner-controlled database materials remain private
- **Bartholomew:** `Bartholomew and the Grinning Tavern Cat`, `Bartholomew and the Tavern Cat`
- **Be / Bee:** `Be a Buddy, Not a Fuddy`, `Be an MD`, `Bee the Miracle`
- **Bethlehem / Babel:** `Bethlehem Overlay`, `Bethlehem DVG`; Babel / Tower of Babel research and related word studies
- **Biblical / Binary:** `Biblical Universe`, `Biblical Matrix`, `BINARY_PROTOCOL`
- **Black / Blackjack:** `BLACKJACK`, `The Black Time Widow`, `Black Matter Avenger`, `Black Widow`
- **Book / Build:** `BOOKS_201`, `BOOK_AND_GAME_SOURCE`, `BUILD_EVERYTHING_NOTHING_v065`
- **Buddy / Hunny:** `Buddy & Hunny`, `Buddy Boo & Hunny Zoo`, North/South Pole and Christmas stories
- **Bull / Battle:** `The Bull of the Gilded Chest`, `The Battle for Innocence`, `The Beast on the East River`

These names are **finding aids**, not evidence of completed software or manuscripts. The full source-aware title rows, personal paths, author-locked files, unpublished originals, private databases, and owner Library URLs stay in the owner-controlled archive.

## B variation routes

See [routes.json](./routes.json) for the machine-readable rules, and [b-family.mjs](./b-family.mjs) for read-only classification and reversible string operations.

1. Letter case, typography and repetitions: `B`, `b`, `BB`, `BBB`.
2. Spoken/phonetic sound families: `B` / `bee` / `be`; pronunciation verified separately for each language and context.
3. Literal reversals: e.g. `BABEL` -> `LEBAB`. A reversed string is not automatically an existing word.
4. Glyph mirror/rotation candidates: lower-case `b`, `d`, `p`, `q`, with **font and transform specified**; they are not linguistically interchangeable.
5. Numeric/geometric candidates: `8`, two loops, stacked `OO`, sideways eight `∞`; **visual form only**, not universal etymology or numeric identity.
6. Cross-script exploration: Greek beta, Cyrillic be/ve, Hebrew bet, Arabic bā’; distinguish glyph appearance, historical origin, and actual pronunciation.
7. Word roots, prefixes, original title families, and connection routes are recorded **as linked interpretations**, never overwritten into an original.

**B as a letter is not LOC subject shelf B.** Titles starting with B remain in their original subject shelves. Any inferred link is a *candidate*, with evidence type and review status.

## ONE integration and boundaries

`NATHAN AI -> TABOR ROOT -> TABOR 1-2-3 FACTORY -> ONE — THE LAST APP`

- The [existing Catalog app](../index.html) remains the authoritative interface for importing the full owner catalog locally in the browser.
- The new module only classifies terms; it does not duplicate, change, download, publish or run owner files.
- `b-family.test.mjs` checks preservation of raw wording and the separation between spellings, visual candidates and verified original works.
- Image-only stacked loops remain **unverified** without pixel/visual examination.
- No title, concept, reference, file pointer or review row is automatically a completed project.

## Run checks

```sh
node --test archive-index/loc-b8/b-family/b-family.test.mjs
node --test archive-index/loc-b8/catalog.test.mjs
```

Original catalog: [B/8 discovery README](../README.md). Public aggregates: [summary.json](../summary.json). Private full B index: `Nathan_Tabor_B_Work_Index_2026-11-05.md` in the user's owner-controlled Library.

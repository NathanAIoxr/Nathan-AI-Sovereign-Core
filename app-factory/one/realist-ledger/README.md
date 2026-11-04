# NATHAN AI 🚀 — The 101-Action Chronicle

**An additive, zero-dependency, local-first module for ONE.**

This project makes three usable experiences from the author's 101-point source ledger:

1. **App — Chronicle Filing Cabinet:** Indexed browse/search of 101 action slots; four original sections; per-entry review flags and separate private notes; import/export.
2. **Game — 101 Gates:** A playable 101-round volume-association game using the imported verbatim action descriptions; feedback, score, streak, progress, and restart. Without a private import, it runs with 101 numbered gates and section labels.
3. **Four-book series:** Volumes I–IV map to actions 1–25, 26–50, 51–75, and 76–101. After import, export four complete source-volume Markdown manuscripts, preserving numbered entries word for word.

**Open:** `index.html` in a modern browser. No build step or account needed. It also works as a static GitHub Pages module.

## Import the original source

Select **SOURCE & METHODS → Choose original ledger (.txt)** and choose the source text containing all 101 individually numbered entries. The parser checks that each action number from 1 through 101 is present once. The app stores the parsed source only in the current browser's local storage. There is no transmission or remote storage in this app.

The public code intentionally does not ship the author's unpublished personal ledger, named allegations, or private autobiographical notes. Source is supplied separately by the author. The supplied source is never rewritten by the app; book exports preserve each numbered entry's wording.

## Books

- [Volume I — Structural Reconnaissance](books/volume-i.md)
- [Volume II — Linguistic Decryption](books/volume-ii.md)
- [Volume III — Direct Confrontation](books/volume-iii.md)
- [Volume IV — Counter-Matrix Blueprint](books/volume-iv.md)

Each public book file is an editorial scaffold containing section titles and action ranges, **not a claim of 25 fully written narrative chapters**. A locally imported complete ledger produces full populated source editions, ready for development into longer books.

## Verification boundaries

The 101 items are the author's autobiographical statements, interpretations and claims; independent corroboration is **not** implied. Notes and research verification remain a separate data layer. This implementation does not endorse threats or unlawful action; the game tests classification and recall only.

## Security & privacy

- No external scripts, analytics, account registration, or API key storage.
- Local storage holds imported personal text and research notes **on this device**. Avoid shared devices. Use **Clear local copy** to remove them.
- Exports are explicit browser downloads, never pushed automatically to GitHub.
- Text nodes are rendered with `textContent`, preventing injected source markup from executing.
- Source records and original platform architecture are preserved; integration is additive.

## Tests

Run `node ../tests/test-core.js` from this directory in the full working package, or run the test from the repository folder when it is included. Node.js is used for tests only, not app execution.

## Original arithmetic

**1+1=2 — BUILD** · **1−1=0 — CLEAR** · **YES IS YES — NO IS NO.**

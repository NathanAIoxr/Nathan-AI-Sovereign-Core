# TABOR ONE — Full Symbol, Sound & Language System v1.0

A complete **versioned prototype** with a standalone offline browser interface, 100-word constructed lexicon, 20-letter alphabet, dot/dash transcription, comparative Ogham, Morse, UTF-8 binary, a base-13 positional number converter, deterministic 4-bit/5-bit/9-bit typed identifiers, documented grammar, and automated tests.

## Start

- Open `index.html` in a modern browser. No server or account needed.
- Run `python engine.py 'UNO DOS TRES CUATRO'` for all comparative encodings.
- Run `python engine.py 'TÁBOR' --mode mirror-words` for word mirror output.
- Run `python engine.py --lookup WATER` to inspect a dictionary record.
- Run `python engine.py --base13 169` to get `100`.
- Run `python engine.py --decode-bits '01010101 01001110 01001111'` to get `UNO`.
- Run `python -m unittest -v test_engine.py` for tests.

## Contents

`index.html` — fully offline interactive interface (100-entry lookup, alphabet, grammar, text converter).

`lexicon.json` — 100 words (original 12 **verbatim**, 88 clearly marked new entries).

`alphabet.json` — all 20 author-supplied letter/glyph/5-bit/sound pairings, plus historic Ogham Unicode reference.

`engine.py` — CLI and importable Python converter; strict UTF-8 binary decode.

`GRAMMAR.md` — detailed grammar with operators, sentence templates, negation, tense, possession, questions, base-13 numbers and examples.

`SOURCE_ANCHORS.md` — exact original source anchors and scientific/historical boundary notes.

`test_engine.py` — executable unit tests.

## Boundaries and integrity

1. Historic Ogham is not a binary numeral notation. Tabor's 5-bit alphabet is an original construction.
2. The Paleolithic signs have not been deciphered as a 32-character language alphabet. A 32-sign research inventory is not a proof of a unique universal code.
3. Action potentials are stereotyped events, but information in nervous systems is not simply two universal static voltage labels.
4. Binary encodes data in discrete states; it is not a proved genetic ancestor of Morse, Ogham or Paleolithic marks.
5. "Original code that made the code" is a philosophical/modeling hypothesis, not a documented single historical language.
6. English/Spanish comparison currently encodes characters and supports exact lexicon aliases, **not** full semantic translation.
7. The app is not cryptographic security. It makes no guarantees about breach resistance or truth verification.

## Authorial preservation

Original supplied 12 roots remain in `lexicon.json` with `origin="Original 12"`. Source excerpts and the original sentence are retained in `SOURCE_ANCHORS.md`. All new grammar operators and added vocabulary are clearly proposed additions. All changes are additive.

**1+1=2 — BUILD · 1−1=0 — CLEAR · YES IS YES — NO IS NO.**
# THE MOSAIC READER — APP · GAME · BOOKS
**By Nathan Tabor** | The Taborite Model | Nathan AI Sovereign Core | Integrated Edition 3.0

An **additive ONE App Factory module**. No existing repository files have been overwritten.

## Start

- [Project home](index.html) — links the app, game and books.
- [Reader app](reader.html) — preserved Mosaic Reader 2.0, seven workspaces.
- [Cipher Quest game](game.html) — five playable Ogham and evidence challenges.
- [Book series](books/README.md) — three complete short manuscript editions, plus a proposed 13-volume roadmap.
- [Original research-method notes](READER_METHOD_V2.md) — source and version-1 compatibility details.

Open the HTML files locally in any modern browser; the reader and game do not need a server. If the repository is hosted on HTTPS and the browser supports it, the included web manifest and service worker may also enable an installed/offline web-app experience. GitHub publication alone does not confirm Pages hosting.

To serve a checked-out repository locally, use a standard static HTTP server from its root, for example Python's http.server on port 8000, and navigate to the app-factory/one/mosaic-reader/ directory.

## App architecture

The preserved research app contains: Mosaic Reader image annotation; Cipher Studio; Ancient Scripts; Ogham Key; Universal Written Matrix; Spoken Sounds IPA input; Archive & Method JSON import/export.

No automatic image recognition, universal linguistic decipherment, real-time speech recognition, or secure cryptography is claimed. Its TMR1 Unicode transformation is an educational reversible cipher. An earlier v1 project can be imported into v2 without overwriting original source notes.

### Game mechanics

| Quest | Activity |
|---|---|
| Ogham Alphabet | Identify conventional letter values |
| Stroke Grid | Identify family and 1–5 mark count |
| Three Worlds | Assign BELOW / MIDDLE / ABOVE / UNPLACED by architectural position |
| Evidence Vault | Distinguish observation, translation, provenance and proposed meaning |
| Master Decoder | Mixed test across the previous quests |

The game includes hints, detailed answer explanations, keyboard 1–4 and Enter, offline localStorage XP and best scores, and portable JSON export. It does not modify the research app's project JSON.

## Ogham master chart

| Family | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| F1 right | ᚁ B | ᚂ L | ᚃ F | ᚄ S | ᚅ N |
| F2 across | ᚆ H | ᚇ D | ᚈ T | ᚉ C | ᚊ Q |
| F3 left | ᚋ M | ᚌ G | ᚍ NG | ᚎ ST | ᚏ R |
| F4 center | ᚐ A | ᚑ O | ᚒ U | ᚓ E | ᚔ I |

Later forfeda: ᚕ EA, ᚖ OI, ᚗ UI, ᚘ IA/IO, ᚙ AE; Unicode also includes supplementary ᚚ Peith. The forfeda's values are variant across historical sources.

**Historical correction kept explicit:** D is F2:2, not F2:1; the sequence is H-D-T-C-Q.

Example: modern TABOR → ᚛ᚈᚐᚁᚑᚏ᚜. This is a modern letter substitution, **not** an attested Primitive Irish translation.

## Books

- **I: The Spine and the Stone** — seven narrative chapters and field practice.
- **II: Four Families, Five Marks** — eight chapters and the Ogham teaching grid.
- **III: The Universal Reader's Atlas** — ten chapters addressing text, speech, IPA, Unicode, and evidence.
- **IV–XIII** — a forward-looking roadmap, **not completed books**.

## Test

From the cloned repository run: **node tests/check.mjs** inside this directory.

Static checks verify expected files, Ogham glyph coverage, preserved research sections, and manuscript chapters. Browser QA is a separate step; passing static tests is not a claim of exhaustive interactive testing.

## Method

SPINE → ARMS → COUNT → ROOT → CONTEXT.

Source, linguistic value, interpretive reading, and experimental cipher are separate fields. The same questions may be applied across languages, but that does not imply all languages derive from Ogham or can be automatically decoded by one five-by-four grid.

**Below** = floor / underworld / subconscious. **Middle** = wall / column / consciousness. **Above** = dome / heavens / supra-consciousness. These psychological associations are the author's Taborite Model, not universal historical facts.

**1 + 1 = 2 — BUILD. 1 − 1 = 0 — CLEAR. YES is YES — NO is NO.** Preserve originals and add layers rather than replacing source records.

## References

- Unicode Ogham names: https://www.unicode.org/Public/18.0.0/charts/nameslist/1680/
- Unicode Ogham chart: https://www.unicode.org/charts/script/chart_Ogham.html
- International Phonetic Association: https://www.internationalphoneticassociation.org/

Attribution: **The Mosaic Reader / Taborite Model by Nathan Tabor**, produced as a Nathan AI Sovereign Core project. The repository's license applies unless its owner specifies a separate one.
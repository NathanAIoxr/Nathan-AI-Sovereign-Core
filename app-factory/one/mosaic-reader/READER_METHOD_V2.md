# THE MOSAIC READER — UNIVERSAL DECODER 2.0

**By Nathan Tabor**  
**Built upon the Taborite Model by Nathan Tabor**  
Single-file, browser-based research tool; additive upgrade of version 1.0.

## Start

Open **`The_Mosaic_Reader_by_Nathan_Tabor_v2.html`** in a current desktop or mobile browser. No server is required. Nothing is uploaded by the application. Mosaic images and optional audio are selected locally. Audio is played locally but **not** stored inside project exports; image data **is** stored in the project JSON unless manually removed.

## Seven application areas

| Screen | What it does | What it does not claim |
|---|---|---|
| **01 Mosaic Reader** | Photograph, place point annotations, capture provenance and original inscriptions, analyze architectural position and geometric features | Automatic image recognition or archaeologically proven hidden message |
| **02 Cipher Studio** | Encode/decode arbitrary Unicode strings using the preserved TMR1 B/M/A reversible educational transformations | Secure encryption or linguistic translation |
| **03 Ancient Scripts** | Detect a subset of Unicode script families and transliterate known Ogham / Elder Futhark characters | Full translation of historical languages |
| **04 Ogham Key** | Reference master grid (20 primary + 5 supplied forfeda), supplementary Peith, character-by-character readings, comparison of written order, modern-letter substitution | One universal value for historically variant supplemental letters |
| **05 Universal Matrix** | Record any Unicode script, grapheme/code-point counts, spine, direction, observed strokes, language, attested sources, root anchors, and Taborite interpretation | Derive physical strokes, sound, etymology, semantics or decipherments automatically from Unicode alone |
| **06 Spoken Sounds** | Enter original spoken transcript and human-checked IPA, inspect common phonetic categories, optionally play local audio, retain phonetic analysis in project | Perform offline transcription/voice recognition or raw acoustic measurement |
| **07 Archive & Method** | Save the complete annotated project as JSON, reload an original v1 or new v2 project, audit analyses | Cloud sync or durable browser-only autosave |

## The five-stage pattern (universal research scaffold)

1. **SPINE / carrier.** Record the actual baseline, stone edge, letter frame, visual register, or voice stream.
2. **ARMS / gesture.** Record the mark direction, interruptions, crossings, loops, or articulation. For non-Ogham scripts this field is a user observation, not a historical equivalence.
3. **COUNT.** Count observed marks or repeated elements. Record the total; Unicode code points are **not** visual stroke counts, syllables, or acoustic bursts.
4. **ROOT / sound.** Supply a sourced pronunciation, IPA transcription, letter name, phonetic value, grammatical context, environmental association, or proposed etymology.
5. **CONTEXT / source / interpretation.** Locate the inscription in the artifact, date it if possible, cite a catalog or scholarly source, then separately propose a Taborite interpretation.

### Taborite architectural model

- **BELOW / floor / earth / underworld / subconscious**
- **MIDDLE / wall / column / present world / consciousness**
- **ABOVE / dome / vault / sky / cosmos / supra-consciousness**

These are the author's interpretation categories and should be preserved alongside, not substituted for, material and historical evidence.

## Ogham matrix — master coordinate chart

The foundational signary is four families of five letters. The application displays a further five selected *forfeda*, for a 25-sign master chart, and shows the later Unicode **Peith** as a supplemental sixth. It retains letter names and symbolic associations as separate fields.

| Coordinate / gesture | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **F1 · right** | ᚁ B Beith | ᚂ L Luis | ᚃ F Fearn | ᚄ S Saille | ᚅ N Nion |
| **F2 · across / diagonal** | ᚆ H Uath | ᚇ D Dair | ᚈ T Tinne | ᚉ C Coll | ᚊ Q Ceirt |
| **F3 · left** | ᚋ M Muin | ᚌ G Gort | ᚍ NG Ngeadal | ᚎ ST / Z Straif | ᚏ R Ruis |
| **F4 · center / vowels** | ᚐ A Ailm | ᚑ O Onn | ᚒ U Ur | ᚓ E Eadhadh | ᚔ I Iodhadh |
| **F5 · later selected forfeda** | ᚕ EA Eabhadh | ᚖ OI Or | ᚗ UI Uilleann | ᚘ IA / IO Ifin | ᚙ AE Eamhancholl |

**Supplementary Peith:** ᚚ P. The traditional order for the diagonal group is **H → D → T → C → Q**. Thus **D is the second position**, not the first position as stated in the supplied draft. Forfeda values vary across manuscripts; transliterations are approximate rather than definitive.

For monumental inscriptions, upward reading along a stone edge is common; manuscripts often place glyphs horizontally. Edge continuation must be established for the actual artifact. The app does not infer source orientation from a Unicode string.

### Worked example: “TABOR” into an Ogham character sequence

User-supplied modern Latin letters are substituted as follows:

| Letter | Ogham | Grid coordinate |
|---|---|---|
| T | ᚈ | F2, 3 across-strokes |
| A | ᚐ | F4, 1 center-mark |
| B | ᚁ | F1, 1 right-side stroke |
| O | ᚑ | F4, 2 center-marks |
| R | ᚏ | F3, 5 left-side strokes |

Result: **᚛ᚈᚐᚁᚑᚏ᚜**. The feather marks (᚛ and ᚜) bracket the sequence. **This is a modern letter-to-letter demonstration, not the Primitive Irish translation of “Tabor.”** The original text and any interpretation must remain separately documented.

## Spoken-language layer

1. Enter a written transcript in its original language (optional for IPA-only tests).
2. Enter an **IPA transcription** obtained from a speaker or scholarly source. E.g., `/t͡ʃaɪld/`.
3. Choose **Decode phonetic pattern**. The lab reports sound units whose IPA signs it recognizes, the usual place/manner/voicing categories, and clearly marked unknown signs.
4. Add the cited root and pronunciation source, then **Add sound analysis to project**.
5. If using a local audio file, play it beside the IPA field; playback is local and the audio is not exported.

The Ogham analogies are deliberate conceptual transformations: vowels as centered resonance, oral stops as blocked flow, nasals as resonant flow, and fricatives as a crossing/turbulence category. These are **not literal mappings validated for all languages**. The original IPA and sources must be kept.

## How to save a mosaic detail with an Ogham-pattern annotation

1. In **Mosaic Reader**, enter artwork provenance and upload the source photograph.
2. Click a detail, then select BELOW / MIDDLE / ABOVE based on its **actual installation**.
3. Enter only observed traits in **Observed**, with any inscription copied literally into **Literal inscription**.
4. Under **Ogham-pattern geometry ledger**, record axis, gesture, a counted 1–5 mark sequence if genuinely observed, a proposed root, and an IPA citation if available.
5. Put interpretation in **Proposed Taborite reading** and choose the evidence level.
6. Save the annotation. Additional written or spoken analyses can be saved in their respective tabs.
7. Export the complete project JSON to preserve it and optionally export the Universal Matrix report as TXT.

## Backward compatibility and tests

- **Version 1** (`TMR1`) encoding/decoding remains unchanged, including exact Unicode round trips.
- **Version 1 project JSON** can be imported into version 2. It is upgraded internally with an empty analyses ledger and exported in v2 format; the original file is not overwritten.
- Version 2 adds `axisKind`, `strokeGesture`, `notchCount`, `rootAnchor`, and `phoneticHint` to mosaic annotation records and an array named `analyses` for written / spoken reports.
- Tested with browser automation: original three-plane cipher, all 25 selected Ogham glyphs, supplementary Peith, correct H-D-T-C-Q stroke positions, five-letter substitution of TABOR, mixed Ogham/Greek/Hebrew/Han Unicode, IPA affricates, project analyses and annotated geometric records. No JS page errors in the tested flows.

## Interpretation and evidence rules

- Original text and photo are **immutable evidence records in analysis**: upgrades and proposed readings are added in separate fields.
- A botanical / mythological association is not automatically a proven ancient meaning.
- Ogham is not a general cipher that can automatically translate Chinese, Maya, Egyptian, Sanskrit, modern spoken languages, or undeciphered languages. The universal matrix is a **shared annotation protocol** that makes comparisons inspectable.
- A TMR1 code is a reversible demonstration, **not secure encryption**.
- Image annotation is manual. A visual mosaic photograph is not currently automatically read by a trained recognition model.

**Authorial invariants:** 1 + 1 = 2 — BUILD; 1 − 1 = 0 — CLEAR; YES is YES — NO is NO. Preserve the original; add interpretation; do not silently overwrite evidence.

## Public reference sources

- Unicode Consortium, official Ogham character names and supplementary signs: https://www.unicode.org/Public/18.0.0/charts/nameslist/1680/
- Unicode Consortium, Ogham script chart: https://www.unicode.org/charts/script/chart_Ogham.html
- International Phonetic Association, Interactive IPA Chart: https://www.internationalphoneticassociation.org/IPAcharts/IPA_charts_TI/IPA_charts_TI.html

**Attribution:** The Mosaic Reader by Nathan Tabor, based on the Taborite Model by Nathan Tabor. Dedicated to the ancestral traditions named by the author, without asserting genealogical descent as independently documented fact.
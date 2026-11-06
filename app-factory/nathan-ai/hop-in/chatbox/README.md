# NATHAN AI — HOP IN · Interactive Chatbox Studio v0.3

**Public homepage entry:** GitHub Pages repository root `/` now embeds the functioning HOP IN Chatbox directly in a responsive same-origin frame. The distinct Main Hub remains at `/app-factory/nathan-ai/`, and the chatbox has a direct standalone URL at `/app-factory/nathan-ai/hop-in/chatbox/`.

**Feature-stage boundary:** The live/static chatbox supports local question routing, records browsing, source-grounded retrieval, voice UI where browser-supported, optional model adapter handoff, multi-conversation workspace and procedural visual skins. It is **not** a live general LLM service unless a separate owner-controlled model provider is configured. GitHub Pages itself is static and cannot host the Python provider. Do not describe the optional adapter as configured by merely publishing these files.

## November 5 Studio release

- **Conversation library:** create, switch, rename and delete up to 24 distinct chat threads, with explicit Save all, JSON export and validated import. New conversation and CLEAR preserve other threads and the canvas. The existing single-chat backup remains backward-compatible but is not destructively migrated.
- **Spatial research board:** 32 named nodes, 64 links, pointer drag, keyboard arrow movement, add last chat message, labeled node types, undo by reimporting an exported snapshot, explicit save/export/import and zero-state clear. No external execution.
- **Originals first:** `/unboxed` and natural-language archive inquiries route to the 19,317 owner-catalog integration and other existing source indexes without inventing original files. `/paradoxes` routes to its existing research atlas, preserving the separate 118 fictional character roster.
- **Optional multi-turn source-grounded model:** deliberate two-click source review; history sharing OFF by default; when enabled it includes at most eight previous turns capped at 1000 characters each. The server accepts only the current question, up to five previewed sources, approved lens label, and the opted-in recent turns. It cannot execute tools or rewrite archives. HTTPS API with server-side credentials and explicit same-host loopback HTTP provider (e.g. an owner-run Ollama OpenAI-compatible API) are supported. This is local single-owner development only.
- **Visual skins:** six original geometry/symmetry/tessellation/glyph/orbit/minimal families, each accepting any of 2^32 seed values. These are mathematical **parameter possibilities**, not billions of stored unique source images. Glyph-inspired patterns are decorative original marks, **not** authentic ancient inscriptions or translations. Calm-mode toggle and user-triggered Save look keep the controls unobtrusive.
- **Accessibility:** source text is rendered literally, controls are keyboard reachable, reduced-motion styles are respected and compact mobile layout is retained.
- **Homepage:** the root `index.html` displays the chatbox; Main Hub remains accessible by its dedicated navigation. GitHub Pages publication still depends on repository Pages settings and deploy status, not solely on merging into main.

Run from repository root:

```sh
python3 -B app-factory/nathan-ai/assistant/server.py --port 8002
# visit http://127.0.0.1:8002/
```

To enable a strictly owner-controlled OpenAI-compatible local model, set `NATHAN_ALLOW_LOOPBACK_MODEL=1`, `NATHAN_MODEL_URL=http://127.0.0.1:11434/v1/chat/completions` and `NATHAN_MODEL_NAME=<locally-installed-model-id>` in the server process environment. Use only a server you operate. For HTTPS remote providers also set server-side `NATHAN_MODEL_KEY`, never browser-side or checked into Git. A model must actually be installed and available; no local model is bundled by this change.

Tests:

```sh
node --test app-factory/nathan-ai/hop-in/chatbox/engine.test.cjs app-factory/nathan-ai/hop-in/chatbox/studio-core.test.cjs app-factory/nathan-ai/hop-in/chatbox/skin-core.test.cjs
python3 -B -m unittest discover -s app-factory/nathan-ai/assistant -p 'test_*.py'
```

---

# Prior v0.2 and D archive source notes

# NATHAN AI — HOP IN. · Interactive Chatbox v0.2

**Core principle:** INNOCENCE IS THE PRECIOUS GIFT. · 1+1=2 BUILD · 1−1=0 CLEAR.

**Purpose:** One consumer doorway to existing Nathan AI sources, personal creative explorations, research, and A–Z feature concepts. This is a functioning browser **prototype**, not a live universal AI service or finished implementation of every source feature.

## Working functions

- Real text conversation window with local route responses, context-specific links, scrolling that respects users reading older turns, contextual suggestions, seven mode buttons and separately labeled local/source/model responses.
- Seven lenses: Nathan AI Core, Modern Version, Man-Made Lies Stripped (institutional source audit), God Lies Removed (theological critique), Saint Jerome (Vulgate and translation audit), Custom Mind, and Group Assembly. Lens selection never edits historical source evidence.
- Five historical research perspectives (Buddha, Jesus, MLK Sr., MLK Jr., King James), with source investigation prompts; no actual cloned voice, authentic first-person quote or simulated history passed off as fact.
- `features.json` preserves all **104** original A–Z titles (four under each letter) and original user-supplied descriptions. The original heading says 101, but it contains 104. All catalog entries have `stage=concept`, and searchable UI never calls those products complete.
- `settings.json` contains the **43 named root settings** actually enumerated in the pasted 101 Base Root Settings excerpt. No 58 missing entries were invented. Hardware control and unhackability claims remain unverified specifications.
- On-page time slider and macro→micro scale description, linked historical-source prompts. The previous HOP IN module handles name reversals, date validation and supported calendars, with clearly unverified Tabor Almanac draft cycles.
- Personal opt-in Custom Mind viewpoint. Names and dates remain in this tab, are not automatically sent to a model, and aren't saved with chat JSON.
- Browser speech recognition (only when supported and after explicit notice/permission) and speech synthesis. Browser-generated voice is **not** a recording or clone of Nathan Tabor; browser speech recognition may use external speech services.
- Consent-based loading of public source catalogs via existing `workspace.js` and `assistant/engine.js`, including up to five source excerpts when available. Local source retrieval is not LLM factual synthesis.
- Optional **configured local** model draft, sharing only the typed question and explicitly reviewed public excerpts (not the full chat/profile). User must preview and click again before sending, following the existing `/api/nathan/draft` server contract. The draft requires an authenticated server-side provider configured by the operator; public GitHub Pages alone cannot provide this. Errors are surfaced; there are no false claims about provider status.
- Explicit Save, JSON Export, validated Import, CLEAR, optional draft retention, and credential-pattern rejection. Session is memory-only by default. Browser storage is not encrypted; do not use it as a secret vault.

## D original words and variants · app/website link

Use `/d` or `/d variants` to open the [source-first D browser](../../../../archive-index/alphabet/d/index.html), including 138 D/d-starting filename occurrences and 14 “The D” occurrences; 19 distinct transformation and research routes; and the [five exact author A–Z D slots](../../../../archive-index/alphabet/d/canonical-d-sequences.json). The main Nathan AI website and My Desktop launchpad also include this entry. Source strings are not silently normalized or substituted, and no unverified finished books or programs are claimed. The seven existing conversation lenses and all 104 A–Z consumer concepts remain intact.

## Source original names and stages

The A–Z and root-setting records were transcribed from the attached November 5, 2026 user text, with names and descriptions preserved. These include research ideas and proposals, not tested software capabilities. In particular, global live tracking, literal time travel, atomic observation, zero-latency analog voice transfer, invulnerable black boxes, self-destructing hardware and pre-thought safety detection are not implemented or scientifically established by this prototype. Defensive examples do not install trojans or execute code on other systems. A root moral principle is not, by itself, a technical security guarantee.

Historical facts, creative reconstructions, theological readings and contested claims must remain separately labeled. The program never purports to impersonate figures or recover their private thoughts.

## Use

Host the **entire repository root** locally with a static server, for example:

```sh
python3 -m http.server 8765
```

Then open `http://localhost:8765/app-factory/nathan-ai/hop-in/chatbox/`.

Without the optional local development adapter, local responses, feature catalogs, browsers' supported voice and linked tools still function. To enable optional reviewed model drafts, see `../assistant/README.md` (from the Nathan AI folder: `app-factory/nathan-ai/assistant/README.md`). Never put model credentials in browser code or Git.

Test:

```sh
node --test app-factory/nathan-ai/hop-in/chatbox/engine.test.cjs
node --test app-factory/nathan-ai/hop-in/engine.test.cjs
```

The current test suite covers source-count fidelity, route modes, group framing, schema validation, credentials, link whitelist, and A–Z search. Real-browser accessibility, multi-device privacy, offline caching, voice provider behavior and security remain release gates. This demo is not a commercial production release.

## Future work — not yet shipped

1. Accessible live cloud model integration with properly implemented authentication, billing, consent and data retention, plus provider-neutral voice options and permission-based voice assets.
2. Source-derived timeline/map reconstruction with uncertainty flags, cited historical atlases and licensed IIIF images. Never pretend to observe inaccessible real-world spaces or individuals.
3. Verified Tabor Almanac 12/13/17/21-month formula versions, including regional calendrical boundaries and proper dates.
4. User-controlled private genealogical graph, evidence attributes, GEDCOM import, export, explicit sharing permissions and deletion rights.
5. Broader agent/tool orchestration with human review, per-connector permission policies, rate-limits and audit logs. No destructive remote execution or unauthorized monitoring.
6. Source-based multi-party roleplay with clear disclaimers, licensed excerpts, provenance and uncertainty handling.
7. 101-setting canonical source reconciliation: obtain original authoritative missing 58 entries; preserve exact words; do not auto-create them.

## Preservation

Original HOP IN, Assistant, ONE, Almanac concepts, Family Research and all previously committed applications remain separate. This new chatbox is a **namespaced addition** with optional source links, not an overwrite.
## E / 3 / M / W · creator stick construction

Use `/e`, `/e geometry`, `/e titles` or `/e variants` to open the [E archive and working glyph game](../../../../archive-index/alphabet/e/index.html) and [five exact creator-authored E A–Z titles](../../../../archive-index/alphabet/e/canonical-e-sequences.json). This additive route preserves the exact author's two-stick/broken-stick E, two-stick fused-and-bent 3, and four-stick M/W definitions. The source title catalog contains 128 general/public E records; four privacy-reviewed/unknown E entries are withheld. The chatbox remains a local guide, not a universal model. All pre-existing Studio v0.3 features and prior source archives remain intact.

## E word-family source recovery

Use `/eloher`, `/ella`, `/evangelist`, `/eve`, `/eave` or natural-language questions to reach the [18-entry independent E family crosswalk](../../../../archive-index/alphabet/e/index.html#e-word-families). The user's exact “Evangelist (not good)” classification stays separately attributed from its Greek linguistic meaning; similarly EVE female, EAVE of a house, Eve before night/event, fiction and simulation tokens are distinct. The October 21 ELOHER/ELHER token discrepancy is preserved and flagged. No original owner Library file bytes are published or rewritten.

## Complete A–Z catalog routes

The local chatbox supports `/az`, `/alphabet`, `/categories`, `/apps`, `/games` and `/letter A` through `/letter Z` as source-preserving navigation into [the full 26-letter directory](../../../../archive-index/alphabet/index.html). Directory records retain authored letter assignments even when titles begin with other characters. Apple and Google Play category values are low-confidence suggestions for review, not store submissions. App/game/feature/book/source occurrence counts overlap. No original source files, chat sessions or linked ONE apps are changed by browsing.

## Letter F, the Fabric of the Matrix, P Cut Open and Nordic Stick Language

New source-preserving local routes: `/f`, `/letter-f`, `/fabric`, `/f-runes`, `/f-geometry` and `/f-sticks`. Natural queries including “fabric of the matrix”, “F as P cut open”, “fehu rune”, and “nordic stick language” open the [original interactive F laboratory](../../../../archive-index/alphabet/f/laboratory/index.html). It hosts 64 general-public F source title occurrences from the 6,056-row owner catalog, 15 separate F/P and rune reference records, and 150 independent Fabric-of-the-Matrix candidate links. Five F master-catalog titles with non-general privacy states remain excluded.

The owner's wording `F is also a P cut open` is kept as an original structural interpretation. Elder/Younger Futhark ᚠ, elder ᛈ, and Celtic Ogham ᚃ each keep distinct script identities. The phrase “the language that looks like a stick figure stretching” is indexed as an author visual analogy and is not asserted as a historical rune translation. The original Taborite language app and books, E/3/M/W archive and other alphabetical departments are unchanged. This HOP IN response is source navigation, not a configured external generative model.


## Letter G · 5 rotated / 6 reshaped / Nautilus aka Tabor Spiral

New local chat routes: /g, /letter-g, /g-5, /g-6, /g-geometry, /g-spiral, /g-source, /nautilus, /natilus, /tabor-spiral and /spiral. Natural language terms including "tabor spiral", "5 rotated around", "6 reshaped", "the generator", "G geometry", and "letter G" point to the [interactive G source workbench](../../../../archive-index/alphabet/g/laboratory/index.html).

The original creator text is kept exactly: "time for G ... find all G's - 5 rotated around and or a 6 reshaped the natilus aka tabor spiral". Two distinct construction branches are retained. Existing earlier g→6 and the full F/P / E/3/M/W modules are not overwritten.

The main A–Z source index now has 1,937 primary source occurrences (45 G), and a linked standalone compressed source preserves all 713 general/public G-starting title occurrences, including 604 MATERS vs TATERS Family Grove entries. Six editorial/unknown G title records are withheld. Source-catalog entries are not individually completed applications. Historic Roman G developed from C, and measured Nautilus shells should not automatically be equated with the golden-ratio spiral; author symbolic sources and verified history/mathematics retain separate provenance.

## GOD · GODDESS · DOG · DOGGESS · SSEGGOD

Local commands /god, /goddess, /dog, /doggess, /sseggod, /g-words and /og-family navigate the five-name G cross-index and existing Six Dogs / Omni God apps. Original spellings are maintained. Dog and Doggess remain D-initial words, Sseggod remains S-initial, despite additional G cross-indexing by explicit creator instruction.

Literal uppercase reversals are GOD ↔ DOG and DOGGESS ↔ SSEGGOD. GODDESS reverses to SSEDDOG instead: never conflate it with Sseggod or assert these symbolic transformations are linguistic history. The 713 public G titles and Tabor Spiral remain separate source archives. The G research index has 26 source records; A–Z has 1,942 source occurrences. Original private manuscripts remain in the owner's Library.

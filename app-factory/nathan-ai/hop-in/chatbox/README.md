# NATHAN AI — HOP IN. · Interactive Chatbox v0.2

**Core principle:** INNOCENCE IS THE PRECIOUS GIFT. · 1+1=2 BUILD · 1−1=0 CLEAR.

**Purpose:** One consumer doorway to existing Nathan AI sources, personal creative explorations, research, and A–Z feature concepts. This is a functioning browser **prototype**, not a live universal AI service or finished implementation of every source feature.

## Words → Worlds — Unboxed source-first studio (2026-11-05)

[Open the full restoration and completion plan](./UNBOXED_PLAN.md) · [Source archive](../../protection-of-innocence/david-exchange-2026-11-05/README.md)

The chatbox now includes **Create**, also reached with `/studio` or the new starter prompt. The original HOP IN modes, Paradox Atlas and ROOT → CLEAR → BUILD routes remain intact. All new features are local-first browser prototypes:

- App workflow: source → index → relate → derive, with a checklist and original-source links.
- Game: all six source-evidence choices simultaneously visible, scoring and resets.
- Books: all seven book outlines and note editors simultaneously visible, individual or complete-series Markdown export and notes JSON export.
- Learn: all five educational lessons, practice activities and answers simultaneously visible.
- Originals: adult-confirmation gate, then **all complete records opened as plain text**, search, complete JSON export, and user-chosen local-only JSON import of additional original records. Repeat wording is not deduplicated, and IDs cannot collide silently.

The four creator-authored messages were transcribed from the visible current conversation and are not a byte-confirmed full account export. This work does not claim that David's full biography or all other owner manuscripts have been recovered. The adult originals retain their exact displayed text; game/book/lesson copy is new editorial development text. Original words containing threatening language or a slur are not injected into the educational game.

Local import has explicit 8MB-per-file and 1,500-record upper limits; oversize input is **rejected whole**, never partially loaded or truncated. Book drafts over 250,000 characters per volume are likewise rejected for export with an explicit message rather than shortened. Do not store credentials or confidential survivor details.

```sh
node --test app-factory/nathan-ai/hop-in/chatbox/engine.test.cjs
node --test app-factory/nathan-ai/hop-in/chatbox/source-studio.test.cjs
node --test app-factory/nathan-ai/protection-of-innocence/david-exchange-2026-11-05/archive.test.cjs
```

The focused workflow is `.github/workflows/words-to-worlds-ci.yml`. Site deployment, real-device accessibility and repository-wide CI remain separate release gates.

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
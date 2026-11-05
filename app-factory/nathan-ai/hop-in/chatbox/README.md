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

# Prior v0.2 behavior and source notes

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
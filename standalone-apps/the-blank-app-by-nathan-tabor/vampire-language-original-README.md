# The Vampire Language — Meticulously Restored

**By Nathan Tabor**  
**Prototype edition:** 0.1.0 · 12 November 2026

This is a runnable, dependency-free Node.js web app and game. It connects four experiences without overwriting the original-language material:

1. **Translator Studio**: Exact, reversible `V1:` UTF-8 vampire-syllable encoding; `R1:`–`R25:` alphabet-shift decoder rings; an optional cartoon monster spoof with an adult language setting; original silly sound effects, speech synthesis, browser dictation when supported.
2. **Secret Decoder**: Playable mysteries, hints, checking, answer reveal, and custom puzzles you can send to friends.
3. **Restored Lexicon**: A **partial recovered index** of source terms from *The Vampire Language - Meticulously Restored* by Nathan Tabor, organized by culture/region. These historical terms are **not** used as a fabricated conversational grammar. An empty regional branch reserves space for the author's original material. Original spellings are maintained within recovered source fidelity.
4. **Build Worlds**: Create an invitation-code room; friends with the code can post world ideas, story clues, real-world next steps, and achievements. Room data persists in `rooms-data.json` on the server.

## Run locally

**Requirements:** Node.js 20 or later. No packages need to be installed.

```bash
cd vampire-language-app
npm start
```

Visit `http://127.0.0.1:8787`. To run tests:

```bash
npm test
```

For someone else to join your world from another computer, the app needs to be deployed on a reachable server. The default server binds **only to localhost**, for safety. A deployed single-server instance can persist rooms on writable disk; it is not yet production-ready for public use.

## Translation providers

The core code/decoder, spoof, puzzle, lexicon, and shared rooms all run without any translation provider. The **Open Google Translate** button opens the decoded/original message in Google Translate, which can be used with no API key in this app.

To display translated text **inside the app**, configure one of these official APIs on the Node backend:

**Option A — Open-source LibreTranslate:** install and run your own LibreTranslate server on port 5000 (per its installation documentation), then start this app with:

```bash
LIBRETRANSLATE_URL=http://127.0.0.1:5000 npm start
```

Alternatively provide `LIBRETRANSLATE_API_KEY` for an authenticated instance. Translation language coverage depends on the provider's installed models.

**Option B — Google Cloud Translation Basic v2:** Enable Cloud Translation in your Google Cloud project and set a server-side API key:

```bash
GOOGLE_TRANSLATE_API_KEY=YOUR_PRIVATE_KEY npm start
```

**NEVER put your key in browser JavaScript, in a committed repository, or in screenshots.** Google Cloud Translation is a paid cloud service subject to its own terms/pricing. Keep the key in private environment configuration, not source control.

The request flow is:

`Original wording → V1/ring code (reversible) → recovered wording → machine translator → selected living language`

The app does not claim to translate historically authenticated vampire grammar. `V1` is invented game code. A cartoon spoof is creative writing, not reversible translation.

References for API contracts:
- https://docs.cloud.google.com/translate/docs/reference/rest/v2/translate
- https://docs.libretranslate.com/guides/api_usage/

## The source preservation rule

- `reference.json` is the recovered **partial index**, not the full manuscript. It references earlier work by title, author and source note.
- The historical lexicon stays distinct from `codec.mjs` (the fictional cipher).
- More original records can be merged by extending the `groups[].terms` arrays after comparing with the original full database. Never silently replace author-authored terms.
- Each new interpretive, fictional or grammatical layer should be explicitly labeled as such.

## Code examples

`HELLO` encoded with a classic ring shift 13 is `R13: URYYB`.

`V1:` is a UTF-8 byte-for-byte round-trip made from sixteen fictional syllables. Because this is binary-compatible encoding, it also preserves accents, numbers, swear words, emoji, newlines and non-Latin scripts.

Neither code offers confidentiality. **They are puzzle/novelty encodings, not modern encryption.** Don't use them for private correspondence, passwords, or real operational secrets.

## Important hosting limitations

- Shared rooms have invitation codes but **no authentication**, end-to-end encryption, identity verification, or moderation.
- Anyone with a room code can read and post within it. Do not share personal or sensitive details.
- Persistence is local to a single Node.js server. Multiple replicas, serverless ephemeral disks, and public scale require a proper database and authentication.
- The in-memory per-IP rate limiter is a prototype measure, not a production security control.
- Audio and dictation depend on browser support and permission. The soundboard synthesizes its own effects.
- This is a tested local prototype, **not** a published website, mobile app-store release, or production collaboration platform.

## Technical files

- `index.html` / `style.css` — responsive gothic text-first web UI.
- `app.js` — UI behavior, puzzles, world room client, local browser speech, translation interface.
- `codec.mjs` — independently testable reversible code engines.
- `server.mjs` — static serving, translation provider proxy, collaboration room APIs.
- `reference.json` — recovered historical-language term index.
- `tests/codec.test.mjs` — encoding round-trip and parser tests.
- `.env.example` — optional server configuration names (no secrets).

## Next integration steps

If incorporated into an existing repository, preserve the original historical source files untouched. Mount this as a standalone module, connect the actual complete restored database by explicit source identifiers, and give collaboration proper authentication and moderation before public release.
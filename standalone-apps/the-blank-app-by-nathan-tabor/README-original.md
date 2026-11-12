# THE ______ APP — by Nathan Tabor

**Working local prototype v0.2 • 12 November 2026**

**An identity constructor + fantasy franchise launcher + collaborative world-builder + vampire language decoder.**

## Run

Install **Node.js 20+**. Extract the folder and, inside it, run:

```bash
npm start
```

Open **http://127.0.0.1:8787** in a browser. No npm dependencies are required. To run the automated test suite:

```bash
npm test
```

This is a runnable locally hosted web app, **not a public website or a registered company**. Starting it does not legally create a franchise, enterprise, trademark, domain or corporate identity.

## What's inside

**THE ______ app (new)**

- 60+ identity starters including the exact requested VAMPIRE, GARGOYLE, QUEEN, KING, GRANDMA, POP, GOD, THEOS, ELOHER, ELOHIM, ALLAH, JESUS, GODDESS, SATAN, plus additional fantasy and practical roles. Any starter can be replaced with original wording.
- Three fill-in sections: who you are, who/what you want to become, and the world you want to build. A second word can be appended to any title. `GOD` + `TABOR` creates `GODTABOR`.
- Save drafts **locally to this browser**, reload or delete them; copy a text declaration or export a JSON record; format as identity, franchise, or enterprise concept.
- A first-party launch roster with the exact user-supplied GODTABOR, GODSALTER, THEOS, ELOHIM, ELOHER, GODDESS, and GOD titles. The launch phrases are in `identity.mjs`; their original writing is in `SOURCE_WORDING.md`.
- Literal, figurative, and mythological pathways with distinct guidance. A real-world business requires separate legal and practical action.
- Transfer a declaration to the vampire translator, or prefill a shared-world project. **No publication happens until the user explicitly creates a shared room.**

**The Vampire Language — previous prototype incorporated**

- V1: UTF-8 reversible syllable code. The original UTF-8 text is preserved exactly; profanity and non-Latin writing roundtrip too.
- R1–R25: classic alphabet shift / decoder-ring puzzles, reverse decode, clues, and solve-by-answer challenges.
- Cartoon Dracula spoofs and original sound effects, with clean/adult settings and optional browser speech synthesis/dictation when available.
- A **partial recovered** lexicon of named historical words separated from the invented cipher. The full older vampire-language source was not in this package and is **not** claimed to have been completely restored.
- Shared creative rooms accessible via invitation code; posts for world ideas, real-life next steps, story clues and milestones.

## Modern-language translation

The browser has an **Open Google Translate** link that can open the plain meaning in Google Translate without a developer API key.

To provide **in-app** translation, configure **one** of:

```bash
LIBRETRANSLATE_URL=http://127.0.0.1:5000 npm start
```

or a privately held Google Cloud Translation key:

```bash
GOOGLE_TRANSLATE_API_KEY=YOUR_PRIVATE_KEY npm start
```

The backend attempts to call these providers; neither is bundled or turned on by default. Google Cloud may charge fees and require cloud billing. LibreTranslate requires an independently operated service or other approved endpoint. See `server.mjs` and `.env.example` for details. **Never put API keys in the browser code or GitHub.**

Pipeline: `Your original words → optional vampire-code layer → exact decode → machine translation`.

The cipher is a **novelty encoding, NOT secure encryption**. It must not protect confidential information, credentials, or actual espionage communications.

## Your innocence-first rule and the app's limits

The author-supplied original includes the rule **“INNOCENCE IS NOT A COMMODITY”** and a subsequent statement about hacking. `SOURCE_WORDING.md` preserves the words as supplied. The implemented software **does not hack or shut down anyone's device**. Instead, participation in creation/posting of shared rooms requires accepting a community rule, and reports immediately hide a post from that room.

**Public-safety limitations:** This is not a child-safe public social network. There is no age verification, robust authentication, human moderation, appeal process, data deletion policy, scalable database, abuse prevention system, or verified end-to-end encryption. Anyone with a room code can read and post; any participant with the code can report/hide posts. Do not give room codes to untrusted users, and do not use production hosting until these systems are built and reviewed. A checkbox is not comprehensive moderation. Do not store personal/sensitive data in rooms. Room data is stored in `rooms-data.json` in the running folder.

## File map

- `index.html`, `style.css` — responsive gothic/typographic interface
- `app.js` — all interactive screens, local saving, room and cipher interactions
- `identity.mjs` — identity naming rules, original launch roster, JSON declaration
- `codec.mjs` — reversible fantasy code and decoder ring
- `server.mjs` — local HTTP server, optional translation proxy and shared-room API
- `reference.json` — recovered historical-language index, separate from invented grammar
- `SOURCE_WORDING.md` — supplied headline, labels, and original policy wording
- `tests/*.test.mjs` — Node test suite for encoding and identity launch logic

## Deployment checklist

For public use: select a hosting provider that runs a Node server with persistent storage; use HTTPS; add verified accounts, access controls, consent and age-appropriate design, robust abuse review & privacy policies, rate limiting and audit logs; add backup and recovery; review local business/franchise laws and trademark availability before public claims. The current file-based room store is suitable only for limited local demonstrations.
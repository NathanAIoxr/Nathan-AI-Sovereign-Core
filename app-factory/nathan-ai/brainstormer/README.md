# NATHAN AI — THE BRAINSTORMER | Sovereign Creative Editions

**Creator: Nathan Tabor.** First-class module. **CREATE → CONNECT → LAUNCH.** **1+1=2 BUILD · 1−1=0 CLEAR.**

## Independent entry points

| Edition | Entry point | Status |
|---|---|---|
| The Brainstormer Creative Studio | `app/index.html` | Full original v0.0.3 Creative Arcade, expanded only with an opt-in HOP IN button |
| Creative Arcade Game | `game/index.html` | Independently playable, six game modes, XP, A–Z and Christmas 25-day progress, local Idea Garage, backups |
| Book Series Studio | `books/index.html` | Separately functional author/derived chapter writer, editable 13-part series, Markdown and JSON export |
| Communication Academy | `academy/index.html` | Eight writing/communication exercises, original/derived separation, local progress journal |
| Nathan AI HOP IN Interactive Chatbox | `../hop-in/chatbox/index.html` | Linked menu, `/brainstormer` command, seven local template directions from a raw idea, validated context-only handoff |

Open `index.html` to see all independently addressable editions. The larger v0.0.3 app still includes its original Idea Garage, scrapbook, 25-day Christmas calendar, integrity/export and game functions. Separate editions share product purpose and public metadata, not each other's private draft storage.

## Original sources preserved, not overwritten

The original offline v001 HTML and **unedited v0.0.3 Creative Arcade HTML** live in `archive-index/brainstormer/originals/` outside the App Factory. This keeps the originals untouched by the shared appearance and runtime syntax rules. Python v002, both guides and the v003 extension JS remain in `app-factory/nathan-ai/brainstormer/originals/`. The working `app/index.html` is a separate derivative with a tiny opt-in chatbox button.

Originals include:
- `archive-index/brainstormer/originals/NathanAI_Brainstormer_Offline_v001.html`
- `originals/NathanAI_Brainstormer_Python_v002.py`
- `originals/NathanAI_Brainstormer_Python_README.md`
- `archive-index/brainstormer/originals/NathanAI_Brainstormer_Creative_Arcade_v003.html`
- `originals/NathanAI_Brainstormer_v003_README.md`

The v003 extension JavaScript is mirrored at `originals/brainstormer_v003_extensions.js`. The complete local source ZIP additionally contains the original reproducible Python builder and manifest; **those two artifacts are not yet mirrored as separate GitHub files**. The HTML v003 contains the delivered, runnable browser code, but its build helper is an additional source artifact. The full local ZIP is retained for owner audit and future import. Existing unrelated GitHub app, game, book, calendar, ONE, and HOP IN code is not removed or collapsed.

## The shared HOP IN Chatbox interface

1. `/brainstormer` opens the independent Brainstormer hub.
2. `/brainstormer <original idea>` gives seven local **template-based**, not LLM-generated, directions in the chat window.
3. Each standalone edition may send **public context only** (title, edition name, schema version) via same-origin `sessionStorage`.
4. The new chatbox bridge validates this data and prepopulates a draft **for manual review**. It does not send a message, source text, unpublished manuscripts, secrets, personal notes or requests to a model.

## Privacy and quality boundaries

This is local-first, not a synchronized cloud account. Browser storage may be unavailable, local or unencrypted, quota-limited, and device-specific; export your work. No live language model, phone app-store binary, automatic emailing, remote model calls, third-party voice recognition or real-time collaboration is bundled. The creative XP is not a truth or intelligence score. This source integration cannot establish that every archived Brainstormer program or book has been recovered.

## Tests and release gates

- `node --check` all new inline scripts and the chatbox's engine.
- `node --test app-factory/nathan-ai/brainstormer/editions.test.cjs`
- Existing HOP IN engine regressions: `node --test app-factory/nathan-ai/hop-in/chatbox/engine.test.cjs`
- Run the new Brainstormer CI workflow on the PR and review its result.
- Static GitHub Pages can host these files after merging; branch code alone is not evidence that live deployment succeeded.

See the independently supplied `NathanAI_Brainstormer_v003_Complete_Source.zip` for the complete previously assembled local build (original builder and extension module included).
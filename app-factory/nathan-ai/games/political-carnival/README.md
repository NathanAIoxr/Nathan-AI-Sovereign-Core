# NATHAN TABOR'S POLITICAL CARNIVAL
**Author attribution:** Nathan Tabor · **Integration date:** November 13, 2026 · **Status:** additive browser-demo + cross-game public adapter

## Exact original flagship titles
1. **Pin the Donkey on the Tail**
2. **Pin the Tail on the ASS**

Creator's promotional text retained verbatim from this project conversation:
> Are you READY to PIN some DONKEYS and ASSES on TAIL?
>
> if so … these are the games for you

Additional user-defined booths: **dunking booth**, **slam a pie in their faces**, and **apple bobbing wash tub**, with **much more over time**. The browser demo has two playable pinning mini-games. Three carnival booths are reserved as planned modules, not misrepresented as working releases. Apple bobbing will be a non-injurious animated rhythm/collection game, not forced submersion.

## Existing games stay intact
This is a *new directory* inside the existing Games & Puzzles Atlas; it does **not** replace or rewrite existing game engines, names, archives, or cartridges. In particular, the owner's earlier private **TactileCoreSDK** / Universal Finger-Physics Platform retains its own implementations and authorial ownership. This public repository module does not copy proprietary finger-physics code. The original cartridge **05 `boxing_one_finger`** and independent cartridge **07 `pop_up_reflex`** remain separate, unchanged.

### Cross-game availability now
- Public doorway in the existing **Games & Puzzles Atlas** and its search catalog.
- A **Political Carnival** link in the existing additive desktop-game toolbar on games already using it; the other games' gameplay is unchanged.
- Reciprocal navigation from this module to the atlas and other existing games.
- Optional score-event / storage interoperability exported from `bridge.mjs`.

### Public interoperability contract
Other games can opt into a separate score event without rewriting their game loop. In a browser page on the same origin:

```js
import {EVENT_NAME,readScores} from '/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/games/political-carnival/bridge.mjs';
window.addEventListener(EVENT_NAME, event => {
  // Structured score from the carnival module when embedded on this page.
  console.log(event.detail);
});
// On another same-origin page, optional browser-local receipts:
const recent = readScores(window.localStorage);
```

The event is **same-document only**; the `localStorage` receipt is **same-origin and same-browser**. Other games do **not** automatically emit carnival receipts or share unified tournament points until they explicitly adopt this public bridge. No remote database, multi-device sync, chat, real-money payments, or external user accounts are implemented.

Public round shape:
```json
{"schema":"nathan-arcade-score.v1","source":"nathan-political-carnival","gameId":"pin_tail_on_ass","points":100,"tickets":5}
```
The `registry.json` is a discoverable descriptor for future unified arcade launchers. Incompatible cartridge formats are not silently coerced.

## Politician roster
Proposed core roster = **596 positions** at full occupancy (President + Vice President + 9 Supreme Court positions + 100 Senate seats + 435 voting House seats + 50 governors). **No live official directory has been populated**. Currently shipped names are the two owner-mentioned examples, plus placeholders for other branches. Optional owner-provided JSON can load up to 700 entries in the browser, with simple shape:

```json
{"characters":[{"id":"politician-1","name":"Sample Name","office":"Senate","state":"NC"}]}
```

Import is file-selected, temporary in current page memory and not uploaded. This is not an authority for officeholder status or real-world factual claims. Use independently verified sources and revisions for full production roster.

## Mechanics and accessibility
- First game: pin the cartoon donkey onto a tail target.
- Second game: pin the silly tail onto a cartoon donkey target.
- Touch / pointer input; keyboard and assistive-technology alternative: two labeled sliders and a **PIN IT!** button.
- Deterministic per-round distance scoring: 0–100, 1–5 tickets, local leaderboard stats.
- Share plain score and current game URL through supported native sharing/clipboard APIs.
- Pseudonymous browser-local receipt cache (maximum 50), no real-person data attached.
- Animated cartoon-slapstick direction only, no realistic violent targeting.

## Tests
```bash
node --test app-factory/nathan-ai/games/political-carnival/engine.test.mjs
```

## Truthful scope
The game pair is a public playable browser prototype. It is not a validated complete 596-person roster, a published iOS/Android app, a production account backend, a verified patent filing, or a replacement for previously authored games. Existing source, original spelling and other developers' assets remain separate.

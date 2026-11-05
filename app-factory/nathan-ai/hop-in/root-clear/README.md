# NATHAN AI · ROOT → CLEAR → BUILD (v0.1)

**Original author statement, preserved exactly:**

> Things are only complicated because people make them complicated when you remove the complication you see the root issue and is very simple to fix

**The entire three-step rule:**

1. REMOVE THE COMPLICATION
2. EXPOSE THE ROOT ISSUE
3. FIX THE ROOT ISSUE

This is an additive feature under the existing **NATHAN AI → HOP IN interactive chatbox**. It does not change the seven existing chatbox lenses, existing A–Z concepts, source records, Assistant, ONE, or other applications.

## Four functioning experiences

- **Interactive workshop:** Stores original user wording separately from a user-identified complication, root issue, and direct fix. Produces a structured three-step record. No unverified automatic root-cause detection is claimed.
- **THE ROOT RUN game:** 12 multiple-choice rounds, scoring (10 points per correct answer), hints, answer explanations, progress meter, replay.
- **THE ROOT ACADEMY:** 3 interactive lessons with goals, examples, exercises and session mastery markers.
- **THE ROOT ISSUE book series:** 3 generated editable Markdown volumes, each with 3 chapters, based on the input fields; original words retained separately from derived text. This is a **short manuscript generator**, not a completed multi-hundred-page commercial book series.

**Original record:** immutable source quotation in core.js, with a separately labeled example of the complication the prior assistant introduced.

## Start

Serve the repository root as static files:

    python3 -m http.server 8765

Open:

    http://localhost:8765/app-factory/nathan-ai/hop-in/root-clear/

Or use the new link from the HOP IN chatbox:

    /app-factory/nathan-ai/hop-in/chatbox/

No cloud model, account credentials, or external APIs are required. No human likenesses or faces are used.

## Data and privacy

- Nothing is automatically written to local storage.
- User explicitly chooses **Save on this device**, JSON export, Markdown export, or import.
- Browser storage is not encrypted. Do not enter sensitive personal data or passwords.
- The app does not transmit input to a remote model or server.
- Editable interpretations are always labeled separately from original source wording.
- Clear saved record removes only this module's local key; it does not delete chatbox history or other original works.

## Tests

    node --test app-factory/nathan-ai/hop-in/root-clear/core.test.cjs

Test coverage: exact original wording, three governing steps, 12 playable rounds, source separation, three volumes/chapters, and JSON validation.

## Limitations

This is a local deterministic learning/workshop app. The user, not the program, identifies the actual root cause. The manuscripts are starter drafts that remain editable. Full live-model chat integration, publication pipelines, multiplayer play, and server storage would be separate, later upgrades. Existing Nathan AI modules remain untouched except for small navigation/routing additions inside the HOP IN chatbox.

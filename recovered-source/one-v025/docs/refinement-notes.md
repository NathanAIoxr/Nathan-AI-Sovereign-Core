# Private ONE v025 refinement

All work remains in private v025. The previous complete v025 ZIP is preserved at `/workspace/private/history/v025-before-refinement/PRIVATE_ONE_v025.zip` (SHA-256 `8a765938dfaa9c997b2c898a29d7445f0e6fc0e605e36522ca1d7a835e476b62`).

## Player-facing changes

- Both games offer previous-autosave recovery. The newer valid save remains recoverable after restoring the older one. Repeated unchanged saves and reloads retain the useful previous generation.
- Malformed browser saves remain untouched during ordinary play. Explicit recovery or valid import first preserves the damaged bytes separately. The preserved bytes can be downloaded.
- Spiral play supports manual pause, automatic hidden-tab pause and safe paused reopening. A partial feed interval resumes where it stopped, with no background feed accumulation.
- Campaign boards support swipe input, arrow-key focus, Home/End and Escape. Selecting the same tile again cancels. Both games preserve keyboard focus through normal moves and accept the next deliberate tap immediately after a swipe.
- Attempts end with a nearby progress/combat summary, retry advice and a next-stage action. Existing 33-stage progression, free rewards and difficulty medals are retained.
- Stage 23’s guide now correctly explains that the guardian may return to its committed light/dark phase; changing the display alone does not guarantee denial.

## Integrity changes

- Browser turns resolve on a validated temporary state before replacing the live board. Injected resolution exceptions were tested in both games; neither changed the live board or its saved turn.
- Campaign save restoration validates the complete profile, session and optional clock before applying any part. Studio restoration similarly validates both engine state and run metadata.
- Failed backup or preservation writes leave the primary save intact. Unavailable browser storage still permits play and explicit JSON export.

## Evidence

`validation/automated-tests.txt` records the full rules and integration suite. `validation/campaign-browser-results.txt` covers actual completion of all 33 Explorer stages, touch/keyboard play and ONE integration. `validation/studio-browser-results.txt` covers powers, full scored completion, animation lockout and the 52-layer inspector. `validation/resilience-browser-results.txt` covers recovery, corrupted saves, pause/resume, simulated visibility events, input precision, exception rollback and next-stage navigation. Package checks run against freshly extracted exported files.

The preserved 295-file starting source and the separate Git checkout are byte-verified against `BASE_SNAPSHOT_SHA256.json`. No source was pushed, published or uploaded.

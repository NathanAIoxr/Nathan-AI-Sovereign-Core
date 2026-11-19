# Nathan AI 🚀 Coin Ledger

[Ledger](https://nathan-ai-coin-ledger.nathantaboract.workers.dev/) · [Original 64-coin restoration](https://nathan-ai-crypto-64.nathantaboract.workers.dev/restoration) · [DMSP and DIT](https://nathan-ai-crypto-dmsp-dit.nathantaboract.workers.dev/)

The seven D1 tables preserve the chapter's partition names. Import the source slots from the original artwork registry, with original ticker, name, and evidence status. Unresolved slots have null identities. The six-bit coordinate encodes slot minus one. Existing proof receipts preserve the exact version of the source row used in the computation.

The development job searches up to 1,024 nonces for a SHA-256d digest beginning with a zero hex digit. Its output is an append-only proof per slot. The development target is a test difficulty and carries no denomination or reward. The public API reads ledger rows and receipts and independently recomputes proof hashes.

Apply `schema.sql` to the dedicated D1 database and bind it as `DB`. The controlled development job uses `POST /internal/mine?slot=N` and a Worker secret `LAUNCH_TOKEN`. Disable this route after initialization by removing the secret. Test with `node --test worker.test.mjs`.

## Book blueprint

The [book blueprint](https://nathan-ai-coin-ledger.nathantaboract.workers.dev/blueprint) links the previous scene with the supplied world-building notes. `/blueprint.txt` serves the supplied wording, and the HTML page adds a separately labeled technical note.

## Automated verification

The ledger home and book blueprint link the six existing standalone apps. The Cloudflare Cron Trigger `17 * * * *` runs the development receipt audit hourly. A successful scheduled run updates its timestamp in `cycle_clock`. `GET /api/verification` independently checks the current receipts and reports the most recent successful scheduled run. The audit preserves the original proofs and uses no mining credentials.

`GET /api/compute` checks the private `DATABASE_COMPUTE` service binding to `tabor-database-compute-control` and verifies the ledger receipts. The controller response describes registered database placements. It does not start containers or represent production mining activity.

## Codex views

`/codex` and `/api/codex` carry the supplied Codex 1–9 and Voicebox index with six simultaneous views and the fixed X. The routes are read-only and link back to the live ledger, compute checks, and Mining Lab.

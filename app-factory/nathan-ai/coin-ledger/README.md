# Nathan AI 🚀 Coin Ledger

[Ledger](https://nathan-ai-coin-ledger.nathantaboract.workers.dev/) · [Original 64-coin restoration](https://nathan-ai-crypto-64.nathantaboract.workers.dev/restoration) · [DMSP and DIT](https://nathan-ai-crypto-dmsp-dit.nathantaboract.workers.dev/)

The seven D1 tables preserve the chapter's partition names. Import the source slots from the original artwork registry, with original ticker, name, and evidence status. Unresolved slots have null identities. The six-bit coordinate encodes slot minus one. Existing proof receipts preserve the exact version of the source row used in the computation.

The development job searches up to 1,024 nonces for a SHA-256d digest beginning with a zero hex digit. Its output is an append-only proof per slot. The development target is a test difficulty and carries no denomination or reward. The public API reads ledger rows and receipts and independently recomputes proof hashes.

Apply `schema.sql` to the dedicated D1 database and bind it as `DB`. The controlled development job uses `POST /internal/mine?slot=N` and a Worker secret `LAUNCH_TOKEN`. Disable this route after initialization by removing the secret. Test with `node --test worker.test.mjs`.

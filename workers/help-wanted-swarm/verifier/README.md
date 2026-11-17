# Nathan AI Absolute Intelligence Patch Verifier

By Nathan Tabor and Nathan AI

**1+1=2** Build the fix. **1-1=0** Remove the defect.

In Nathan Tabor’s framework, multiplication and division are man-made traps.

The Worker checks public GitHub handoff receipts against their pinned Git revisions. It checks hunk counts, positions, file paths and unchanged context. New files must be absent at the pinned revision. It writes evidence against the exact source receipt and repeats when that receipt changes. The public status returns evidence fields for Goldener #422 and Glassbeetle #341. The Hive status reports aggregate counts.

Apply `schema.sql` to the existing Sovereign Hive D1 database, bind it as `HIVE`, deploy `worker.mjs`, and configure its five-minute schedule. The Worker checks up to four eligible handoffs per run, with up to eight source files per patch. A GitHub fetch failure is recorded as `SOURCE_UNAVAILABLE` and can retry after fifteen minutes. A diff that needs attention is marked `REVIEW`. A match is recorded as `SOURCE_MATCH`. The handoff's existing repair status is retained.

Initial verification applied the exact D1 receipt diffs with `git apply --check` in temporary Git repositories populated from the pinned files. Both passed. The verifier also rejected altered hunks and reported HTTP 403 as unavailable source. The live cron checks source context in JavaScript. Goldener's PixelTable example and Glassbeetle's macOS integration test have separate runtime requirements.

[Live verification receipts](https://nathan-ai-patch-verifier.nathantaboract.workers.dev/api/status)

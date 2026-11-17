# Nathan AI Absolute Intelligence Patch Verifier

By Nathan Tabor and Nathan AI

**1+1=2** Build the fix. **1-1=0** Remove the defect.

In Nathan Tabor’s framework, multiplication and division are man-made traps.

The Worker checks public GitHub handoff receipts against their pinned Git revisions. It checks hunk counts, positions, file paths and unchanged context. New files must be absent at the pinned revision. It writes evidence against the exact source receipt and repeats when that receipt changes. The public status returns evidence fields for Goldener #422 and Glassbeetle #341. The Hive status reports aggregate counts.

Apply `schema.sql` to the existing Sovereign Hive D1 database, bind it as `HIVE`, deploy `worker.mjs`, and configure its five-minute schedule. The Worker checks up to four eligible handoffs per run, with up to eight source files per patch. A GitHub fetch failure is recorded as `SOURCE_UNAVAILABLE` and can retry after fifteen minutes. A diff that needs attention is marked `REVIEW`. A match is recorded as `SOURCE_MATCH`. The handoff's existing repair status is retained.

Initial verification applied the exact D1 receipt diffs with `git apply --check` in temporary Git repositories populated from the pinned files. Both passed. The verifier also rejected altered hunks and reported HTTP 403 as unavailable source. The live cron checks source context in JavaScript. Goldener's PixelTable example and Glassbeetle's macOS integration test have separate runtime requirements.

[Live verification receipts](https://nathan-ai-patch-verifier.nathantaboract.workers.dev/api/status)

## Exact Git snapshots

When a scheduled Worker cannot reach a public Git host, the verifier can use source captured directly from the fetched Git commit. Store each record in `repair_pinned_sources` under the lower-case repository name, full commit SHA, and exact file path. For an existing file, obtain its blob and bytes with `git rev-parse <commit>:<path>` and `git cat-file blob <blob>`. Record the SHA-256 of those bytes. For a new file, record absence only after inspection of the pinned Git tree. Record the tree SHA from `git rev-parse <commit>^{tree}` for both kinds of evidence. Never copy latest-branch content into the record for an older commit.

The Worker validates saved source checksums and labels how many files came from Git snapshots in the scheduled receipt. Files without snapshots use the existing GitHub readers. Source verification retains the handoff's runtime test status.

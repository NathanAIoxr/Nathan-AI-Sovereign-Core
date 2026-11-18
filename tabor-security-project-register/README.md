# Nathan AI Project and Provenance Register

Seven project records cross-reference the Guardian V2.0 symbolic financial sweep, the reported 1993 and GOTV source history, the reported November collection, Semantics Antivirus, Outside Box, and the live Wordplay Matrix. Attribution claims are kept as reported provenance until an original can be verified.

Three fixed inputs exercise ledger arithmetic, source-integrity checks, and backup-integrity checks. Their receipts hash the original-order JSON response fields without the receipt property. No network calls, uploads, credentials, wallet actions, executable samples, or administrative controls are part of these fixtures.

Run `node --test worker.test.mjs` from this directory. The Cloudflare service exposes only a public read-only homepage, project catalog, health information, and fixture results. To deploy from the source directory, run `npx wrangler deploy`.

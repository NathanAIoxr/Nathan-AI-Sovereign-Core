# Holding Vault reader bots

The GitHub Reader inspects pinned manifest blobs from the owner repository when the Holding Vault already maps their exact paths to a holding zone. It checks the Git object and parses its JSON. The Cloudflare Reader matches the same registry's project IDs to verified release and feature records in the owner build ledger. Both record evidence and a review action in the Holding Vault database. Readers keep existing review decisions and never execute project files or mutate source build tables.

The native GitHub Actions schedule runs both readers every six hours at minute 17 UTC. The workflow uses GitHub OpenID Connect. Cloudflare verifies the issuer, audience, repository ID, workflow path, and main branch. GitHub needs no stored Cloudflare API secret for these jobs. It writes to `zone_reader_candidates` and `zone_reader_runs` only. Apply `schema.sql` to `tabor-holding-vault` before running the workflow.

Open the owner-only Holding Vault reader queue at `/holding-vault/preview/readers`. Review the linked source and the destination zone before deciding whether to integrate a candidate.

## Provenance readers

`NATHAN_GH_BOT` hashes all Git blobs in the checked-out commit, including binary blobs. `NATHAN_LINK_TRACER` resolves references within that commit and records every inbound path, including when several files point to the same target. Its graph identifies text files with no detected outbound references and files that can reach those leaves. It keeps missing paths, external destinations, binaries, Git LFS pointers, and size limits visible in the receipt. It does not call destination URLs. Run from the repository:

```sh
node integrations/holding-vault-readers/trace-github.mjs /tmp/github-reader-receipt.json
```

The existing GitHub job can save that JSON graph as a GitHub Actions artifact. The graph contains digests, paths, and references rather than source bytes.

`NATHAN_CF_BOT` exports `scanD1` and `scanStorage` in `trace-cloudflare.mjs`. Pass an authenticated Cloudflare request function and an owned source. D1 returns the next row offset. KV and R2 return the next provider cursor. Record the cursor alongside each completed batch. D1 offsets describe the current ordered source and can shift when the source changes during a run. Review per-record read errors and object size boundaries before marking a source complete.

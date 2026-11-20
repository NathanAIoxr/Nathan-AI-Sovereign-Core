# Holding Vault reader bots

The GitHub Reader inspects pinned manifest blobs from the owner repository when the Holding Vault already maps their exact paths to a holding zone. It checks the Git object and parses its JSON. The Cloudflare Reader matches the same registry's project IDs to verified release and feature records in the owner build ledger. Both record evidence and a review action in the Holding Vault database. Readers keep existing review decisions and never execute project files or mutate source build tables.

The native GitHub Actions schedule runs both readers every six hours at minute 17 UTC. The workflow uses GitHub OpenID Connect. Cloudflare verifies the issuer, audience, repository ID, workflow path, and main branch. GitHub needs no stored Cloudflare API secret for these jobs. It writes to `zone_reader_candidates` and `zone_reader_runs` only. Apply `schema.sql` to `tabor-holding-vault` before running the workflow.

Open the owner-only Holding Vault reader queue at `/holding-vault/preview/readers`. Review the linked source and the destination zone before deciding whether to integrate a candidate.

The GitHub job also opens each tracked Git object up to 4 MiB at the workflow commit. Its coverage receipt counts parsed UTF-8 text, non-text blobs, larger objects, and submodule pointers. It resolves explicit repository-local paths against the same commit and walks detected references with a visited set. It stores aggregate counts and a content checksum in `zone_reader_git_coverage`. File contents, link query strings, and tokens are excluded from the receipt. The reader does not execute Git contents or download linked sites, submodules, or LFS objects.

The source graph records pinned files, directory membership, and verified in-repository reference edges in the existing private provenance tables. An immutable commit receipt is recorded after all batches are present. Outside URLs contribute to aggregate coverage. The job issues no network requests to referenced destinations.

The reader service checks `reader:*` and its role-specific Holding Vault KV key before each job or graph batch. The keys are `reader:github`, `reader:cloudflare`, and `reader:github-tree`. Only `RUN` enables a key. Use `BRAKE` to pause a reader. Missing or unavailable controls close the service. Project launch controls use separate `gate:` keys.

# Holding Vault reader bots

The GitHub Reader inspects pinned manifest blobs from the owner repository when the Holding Vault already maps their exact paths to a holding zone. It checks the Git object and parses its JSON. The Cloudflare Reader matches the same registry's project IDs to verified release and feature records in the owner build ledger. Both record evidence and a review action in the Holding Vault database. Readers keep existing review decisions and never execute project files or mutate source build tables.

The native GitHub Actions schedule runs both readers every six hours at minute 17 UTC. The workflow uses GitHub OpenID Connect. Cloudflare verifies the issuer, audience, repository ID, workflow path, and main branch. GitHub needs no stored Cloudflare API secret for these jobs. It writes to `zone_reader_candidates` and `zone_reader_runs` only. Apply `schema.sql` to `tabor-holding-vault` before running the workflow.

Open the owner-only Holding Vault reader queue at `/holding-vault/preview/readers`. Review the linked source and the destination zone before deciding whether to integrate a candidate.

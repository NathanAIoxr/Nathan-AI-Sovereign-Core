# Global Catalog Bridge — Nathan AI / Cloudflare / GitHub / Clouder

This is an **additive, read-only integration** between the existing Cloudflare D1 `tabor-global-import-catalog` and the existing 205-repository seed in GitHub. It is *not* a bulk deployment of third-party repositories. **All entries remain discovery-only until license, security, deployment-target and cost review is completed.**

## Confirmed starting state, 2026-11-18
- The Cloudflare `global_atlas_public_repos` table and GitHub `public-github-discovery-205.json` contain exactly the same 205 repository identifiers (no missing/duplicate names).
- Cloudflare also has 334 public components, 18 conceptual layers, 13 public source directories, and 15 `imported_workers` records.
- Existing `nathan-ai-sovereign-concordance` and `nathan-ai-comms-bus` Workers already bind the `tabor-global-import-catalog` D1 database. Preserve them; do not overwrite their code, routes or secrets.
- Your GitHub pocket control-plane source exists at `integrations/pocket-control-plane/` but requires separate credential provisioning and deployment. It is not part of this bridge.

## Live bridge
`https://nathan-ai-global-catalog-bridge.nathantaboract.workers.dev`

Read-only routes:
- `GET /health`: confirms Cloudflare-to-D1 connectivity.
- `GET /api/summary`: counts and public mirror location, excluding private owned-resource inventory.
- `GET /api/repos?limit=100&offset=0`: paginated public repository catalog.
- `GET /api/repos?category=...`: parameterized category filter.
- `GET /api/sources`: public source directories.
- `GET /api/layers`: 18 architecture layers.

The bridge never executes, clones, installs, crawls or scans third-party systems. It has no POST/PUT/DELETE data-mutation endpoints and does not expose the private owner-resource crosswalk.

## GitHub verification
Run `node integrations/global-catalog-bridge/verify.mjs`. The accompanying GitHub Actions workflow checks the Cloudflare D1-backed endpoint against all 205 identifiers in GitHub every six hours and on manual dispatch, once merged into the default branch. No tokens are required for this public metadata comparison.

## Clouder Pro and GitHub Pocket Control
After purchasing/activating Clouder Pro *in the Clouder mobile app* and authorizing the same Cloudflare account, this independent Worker should appear in the Cloudflare Workers inventory. Clouder's mobile permissions/subscription cannot be activated by GitHub, Cloudflare APIs or ChatGPT. GitHub repository code, PRs and checks are managed separately through GitHub's authenticated account. Bidirectional write actions are **not enabled** here; the existing Pocket Control Plane needs securely provisioned `GH_TOKEN`, `POCKET_KEY`, an allowlist and mobile authentication before any such claims.

## Safe installation path for each candidate
Catalog -> review license, repo ownership, maintenance and security -> classify environment -> authorized integration in GitHub branch -> CI tests -> optional isolated Cloudflare deployment -> verification receipt -> set installed status *only after success*. Kernels, containers and physical infrastructure cannot be represented as executable Cloudflare Workers without adaptation.

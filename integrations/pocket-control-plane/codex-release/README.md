# Nathan AI Pocket Control · Codex, Kodex & Nodes

Each project has its own app manifest, entry point, dispatch Worker, route, source status, reading guide, and activity where source is available. The release starts with Codex 0–9 and the separate Codex 1 IT edition, then Kodex, named Codex editions, node projects, unresolved original-source leads, and connected standalone apps. Source recovery entries keep their own project IDs and mark their original as pending.

The deployed dashboard shares a GitHub Pro tab and a Clouder Pro tab within Nathan's existing Pocket Control Plane project. GitHub Actions compiles every Worker independently, verifies its live route, and uses a GitHub-signed OIDC token to post a build receipt to the same dashboard. The Worker checks the exact GitHub repository ID, workflow path, main branch, audience, and RSA signature. It accepts current GitHub public signing keys and can fall back to a short-lived snapshot of those keys when the issuer endpoint is unavailable. A verified run refreshes the cached public key set from the official GitHub endpoint. It processes signed run metadata only. The hourly Cloudflare Worker checks the numbered and named stations in manifest order, validates all nine Crosshairs views, then refreshes and checks the connected standalone apps. The GitHub live verification job checks the same published order before it submits its signed receipt.

Builds validate and package the source on GitHub. Live code was deployed through the authorized Cloudflare account separately. Automatic Cloudflare deployment requires an authenticated deployment integration. Cloudflare's native Git connection returned a disconnected-account error during setup.

Private emails, author archives, and the full recovery index are stored separately from the public repository and from the public Worker. The dashboard runtime binds only the build receipt key-value store and the existing dispatch namespace, and routes only the listed project Worker names and the separately named Crosshairs Worker.

## Release order and receipts

- [Ordered catalog and job sequence](https://nathan-ai-pocket-codex.nathantaboract.workers.dev/release-order)
- [Crosshairs reader](https://nathan-ai-pocket-codex.nathantaboract.workers.dev/work/codex-crosshairs/)
- [Cloudflare verification receipt](https://nathan-ai-pocket-codex.nathantaboract.workers.dev/api/build-status)
- [GitHub build receipt](https://nathan-ai-pocket-codex.nathantaboract.workers.dev/api/github)

## Run checks and compile

    node --test integrations/pocket-control-plane/codex-release/checks.test.mjs integrations/pocket-control-plane/codex-crosshairs/checks.test.mjs
    node integrations/pocket-control-plane/codex-release/build.mjs dist-pocket-codex
    node integrations/pocket-control-plane/codex-crosshairs/build.mjs dist-pocket-codex/crosshairs

The live directory is https://nathan-ai-pocket-codex.nathantaboract.workers.dev/.

## Restore the private archive

With a scoped KV read token and the account and private namespace IDs in `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CODEX_ARCHIVE_NAMESPACE`, run:

    node integrations/pocket-control-plane/codex-release/restore-archive.mjs /path/to/private/restore

The restore command verifies original bytes against the stored SHA-256 of each file. It reads only the owner-authorized Codex archive namespace.

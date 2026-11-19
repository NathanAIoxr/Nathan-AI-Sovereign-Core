# Nathan AI Pocket Control · Codex, Kodex & Nodes

Each project has its own app manifest, entry point, dispatch Worker, route, source status, reading guide, and activity where source is available. The order in manifest.json preserves the numbered series, followed by Kodex, named Codex editions, node projects, and unresolved original-source leads. Source recovery entries keep their own project IDs and mark their original as pending.

The deployed dashboard shares a GitHub Pro tab and a Clouder Pro tab within Nathan's existing Pocket Control Plane project. GitHub Actions compiles every Worker independently, verifies its live route, and uses a GitHub-signed OIDC token to post a build receipt to the same dashboard. The Worker checks the exact GitHub repository ID, workflow path, main branch, audience, and RSA signature. It processes signed run metadata only. Cloudflare schedules an hourly read-only health reconciliation of these project routes.

Builds validate and package the source on GitHub. Live code was deployed through the authorized Cloudflare account separately. Automatic Cloudflare deployment requires an authenticated deployment integration. Cloudflare's native Git connection returned a disconnected-account error during setup.

Private emails, author archives, and full recovery artifacts are stored separately from the public repository and from the public Worker. The dashboard runtime binds only the build receipt key-value store and the existing dispatch namespace, and routes only the project Worker names listed in its build manifest.

## Run checks and compile

    node --test integrations/pocket-control-plane/codex-release/checks.test.mjs
    node integrations/pocket-control-plane/codex-release/build.mjs dist-pocket-codex

The live directory is https://nathan-ai-pocket-codex.nathantaboract.workers.dev/.

# Nathan AI Pocket Control Plane

Additive mobile command gateway for the existing Nathan AI Cloudflare/GitHub fleet. **Not deployed.** This is an independent implementation of public GitHub API features, not Clouder Pro source code.

## Read-only API
- `GET /health`: gateway health
- `GET /repos`: configured repository
- `GET /runs`: latest 20 workflow runs
- `GET /pulls`: latest 20 open pull requests

## Write API
- `POST /dispatch` with JSON `{"workflow":"global-discovery.yml","ref":"main","confirm":true}` triggers only an allowlisted workflow. No arbitrary shell commands, PR merges, deletes, or account-wide permissions.

## Deployment
Create a separate Worker rather than replacing any existing script. Configure Worker secrets `POCKET_KEY` (long random mobile bearer token), `GH_TOKEN` (fine-grained GitHub token with only needed repository Actions permissions), and vars `GH_OWNER=NathanAIoxr`, `GH_REPO=Nathan-AI-Sovereign-Core`, `ALLOWED_WORKFLOWS=global-discovery.yml,macro-cockpit.yml`. Set GitHub token's metadata and Actions permissions as appropriate. Do not store tokens in repository files or query strings. Restrict the Worker behind Cloudflare Access where possible.

For iPhone use an iOS Shortcut with a bearer header stored in a protected location, or a native Keychain-backed client. Do not place the secret in a public PWA bundle or localStorage. A PWA requires a separate secure authentication layer and CSRF controls.

## Remaining milestones
- Cloudflare Worker deployment and secret binding
- GitHub webhook endpoint with raw-body HMAC SHA-256 signature validation and replay handling
- Mobile authenticated UI / iOS Shortcut package
- Read-only job-log and Pages telemetry endpoints
- Queue-backed incident notifications
- PR review/merge workflow with branch protection checks and explicit per-PR confirmation
- Live end-to-end tests and audit logging

# TABOR 1-2-3 FACTORY — Universal AI Sync Protocol v1

Any AI assistant can produce a JSON project envelope that the Factory imports. This is an **interoperability format**, not an assertion that any provider has integrated.

## Standard envelope
See `sync/example-project.json`. Required: `schema: "tabor123.project.v1"`, `name`, `type`. Optional: `id`, `description`, `status`, `source_ai`, `repository_url`, `assets`, `destinations`, `created`, `approval_required`.

## Three sync paths
1. **Copy/paste:** Ask any AI to return one JSON object matching this format. Paste into Factory > AI Sync > Import.
2. **GitHub delivery:** An authorized assistant writes a project JSON file to `app-factory/sync/inbox/` and updates `app-factory/sync/feed.json` with its URL. Factory can fetch the public feed on demand. This is not private or real-time. GitHub Pages updates may take time.
3. **Future OAuth/API:** A secure backend will accept authenticated submissions from external apps, verify scopes and ownership, queue builds, and require explicit release approvals.

## Security
- The current GitHub repository and Pages site are PUBLIC. Never put private projects, personal data, secrets, API tokens, financial records or unreleased confidential intellectual property into the public sync feed.
- The web app does not have a secure backend. Do not enter API keys.
- Import is data only; no arbitrary code is executed. Verify project provenance before accepting an external payload.
- Never auto-publish based on an unauthenticated feed entry.
- Actual provider sync requires authorized provider APIs; a verbal "sync" command alone cannot bypass provider permissions.

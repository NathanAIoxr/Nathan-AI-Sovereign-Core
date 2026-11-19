# Tabor Build Loop

The Cloudflare Worker runs a durable JavaScript build queue behind an authenticated owner console and remote MCP endpoint.

- [Owner console](https://tabor-build-loop.nathantaboract.workers.dev/console/)
- [MCP endpoint](https://tabor-build-loop.nathantaboract.workers.dev/mcp)
- [Public heartbeat and counts](https://tabor-build-loop.nathantaboract.workers.dev/health)

## Owner access

Set an owner-controlled passphrase as the Worker's `LOOP_OWNER_TOKEN` secret. Use that passphrase in the owner console. It stays in the current tab. To connect ChatGPT, create a custom OAuth MCP app pointing to the MCP endpoint if your account supports custom write actions. The server accepts the ChatGPT OAuth redirect URLs and uses authorization-code PKCE (S256). Reauthorize when the access token expires.

## Run a plan

Submit one job with `queue_build` or up to 50 jobs with `queue_build_plan`. A task may link up to 12 prerequisites. The server rejects unknown keys and cycles before inserting the plan, and repeated submissions with the same idempotency key return the original plan ID. Use `kind: "probe"` to test dispatch without a model call.

```json
{
  "title": "Inventory report",
  "idempotency_key": "inventory-report-v1",
  "tasks": [
    {"key": "inventory", "prompt": "Export a function that totals item quantities."},
    {"key": "report", "prompt": "Import the inventory function and format the total.", "depends_on": ["inventory"]}
  ]
}
```

| MCP tool | Purpose |
| --- | --- |
| `queue_build`, `queue_build_plan` | Submit jobs |
| `build_status`, `build_plan_status` | Read job state, optional source, and prerequisites |
| `build_queue_status`, `list_builds` | Read counts and filter jobs |
| `build_history` | Read lifecycle, verification, and cancellation events recorded since the upgrade |
| `cancel_build`, `retry_build` | Cancel an unclaimed job or reopen a failed or cancelled one |
| `set_build_pause` | Pause new claims and let work already underway finish |
| `publish_build` | Send previously generated code to the draft branch |

## Dispatch, verification, and GitHub delivery

The five-minute Cron wakes a Durable Object scheduler even when ChatGPT is closed. A successful submission also wakes the scheduler immediately. D1 claims jobs atomically and fences completion by lease. A pending job waits for generated prerequisites. A failed or cancelled prerequisite blocks its descendants until the prerequisite recovers.

Workers AI is the default model. If you set `OPENAI_API_KEY`, the Worker uses the server-side OpenAI Responses API with `OPENAI_MODEL`. The model sees up to 2,500 characters of source from each direct prerequisite. Acorn parses the output as an ECMAScript module, checks that it exports something, and permits static imports only from declared direct prerequisites. Source and SHA-256 receipts are stored in D1. Review and execute generated modules in your separate test environment before promotion.

If you enable GitHub delivery, give `GITHUB_TOKEN` Contents read/write access to the configured repository and set `publish: true` on each eligible task. The only delivery destination is `generated-builds/` on `automation/tabor-build-drafts`. Publish a plan's prerequisites before publishing jobs that depend on them. Use `publish_build` to retry a pending handoff after setting up credentials or publishing prerequisites. It reuses the existing code and hash. Your main-branch release process controls promotion.

## Verify and deploy

```sh
npm ci
npm test
npx wrangler deploy --dry-run
npx wrangler d1 execute DB --remote --file schema.sql
npx wrangler d1 execute DB --remote --file schema-v2.sql
npx wrangler deploy
```

For an upgrade, apply `schema-v2.sql` before deploying the new Worker. It adds plans, controls, and audit events while preserving the original rows. The supplied Wrangler config points to the live database. Set a different binding to run a parallel instance.

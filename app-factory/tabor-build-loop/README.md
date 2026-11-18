# Tabor Build Loop

The Cloudflare Worker accepts three authenticated MCP tools at `/mcp`. `queue_build` records a prompt in D1, `build_status` reads the receipt or generated module, and `build_queue_status` reads the queue and heartbeat. No tool accepts a command line, SQL, arbitrary destination, Cloudflare token, or repository override.

- [Live MCP endpoint](https://tabor-build-loop.nathantaboract.workers.dev/mcp)
- [Public heartbeat and counts](https://tabor-build-loop.nathantaboract.workers.dev/health)

## Owner activation in ChatGPT

1. Set an owner-controlled random passphrase in the Cloudflare Worker’s `LOOP_OWNER_TOKEN` secret using the dashboard or `wrangler secret put LOOP_OWNER_TOKEN`. Keep it in your password manager.
2. On the ChatGPT web app, open **Settings → Apps → Advanced settings**, enable **Developer mode** if your account offers it, and create an OAuth MCP app with the live endpoint above. The authorization screen asks for the passphrase you set in step 1. The server supports authorization-code PKCE (S256) and the ChatGPT OAuth redirect URLs. The session can be reauthorized when its access token expires.
3. Ask ChatGPT to call `queue_build` with a specific JavaScript-module request. Use `kind: "probe"` to test the queue without a model call. Give related retries the same `idempotency_key` and use `build_status` with `include_code: true` to read the output.

## Continuous execution and review

A five-minute UTC Cron records a heartbeat and wakes a named Durable Object. Its alarms service the D1 queue even when ChatGPT is closed. A new authorized submission also wakes the scheduler immediately. Atomic D1 claims, fenced completion, leases, and bounded retries recover interrupted jobs. A generated module has a SHA-256 receipt. The Worker does not execute generated code.

The deployed model fallback is Workers AI. Set the optional `OPENAI_API_KEY` secret and `OPENAI_MODEL` to use the OpenAI Responses API. The OpenAI key is a server-side secret and never becomes an MCP tool.

If you choose GitHub delivery, add a fine-grained GitHub token for this repository with Contents read/write to `GITHUB_TOKEN`. Job-level `publish: true` is required. Delivery creates a new path under `generated-builds/` on `automation/tabor-build-drafts`. Generated work can then be reviewed and promoted into your normal GitHub/Cloudflare release workflow. The draft branch is intentionally outside the production deployment path. Without a GitHub token the generated code is still available in D1 using `build_status`.

## Verify and deploy

```sh
node --test build.test.mjs
npx wrangler d1 execute tabor-autonomous-builds --remote --file schema.sql
npx wrangler deploy
npx wrangler secret put LOOP_OWNER_TOKEN
```

The supplied Wrangler config points to the deployed D1 database. Use a separate database if you want a parallel instance. The local tests use an in-memory SQLite adapter for D1, stub the model and GitHub calls, and verify authorization replay, atomic claim, idempotency, artifact digest, and the draft destination. Test generated code in a separate review environment before merging it.

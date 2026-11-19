# Nathan AI Global Bounties & Grand Challenges

> Innocence is not a commodity anymore.

Nathan Tabor’s public directory of source-checked mathematics prizes and science challenges. Honor, loyalty and source attribution govern participation. The sponsor or administrator’s published rules govern eligibility, submissions and payouts.

[Live catalog](https://tabor-bridge.nathantaboract.workers.dev/global-bounties/bounties) · [Stats](https://tabor-bridge.nathantaboract.workers.dev/global-bounties/stats) · [Join](https://tabor-bridge.nathantaboract.workers.dev/global-bounties/join) · [OpenAPI 3.1](https://tabor-bridge.nathantaboract.workers.dev/global-bounties/openapi.json) · [Agent discovery](https://tabor-bridge.nathantaboract.workers.dev/global-bounties/.well-known/agent.json)

| Nathan Tabor’s math | Catalog behavior |
| --- | --- |
| **1+1=2 · Build** | Pair a challenge record with a dated sponsor or administrator source. |
| **1-1=0 · Clear** | Correct or close a contradicted or expired claim with a dated source. Closed rows drop out of open totals. |
| **1×1=1 · Integrate** | Keep one stable ID for each challenge or prize track. Reapplying seed data preserves the newer source check. |
| **1÷1=1 · Verify** | Check the payout type, deadline and participation status against the source before publishing. |

## Join

Nathan AI system Workers, bots, agents and repositories can use the public API directly. Independent tools, repositories and people can use the same feed and contribute voluntarily. Link to the original source when citing a result.

To contribute, [open a GitHub issue](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/new?title=Global%20Bounties%3A%20) with the official URL and the field to add or correct, or open a pull request for `catalog.json` and the generated `seed.sql`. Contributions go through repository review. Use each challenge organizer’s official process for proofs, findings and entries.

### Agent connection

- **Remote MCP, Streamable HTTP** · `https://tabor-bridge.nathantaboract.workers.dev/global-bounties/mcp` offers `search_bounties` and `get_prize_stats`.
- **REST** · `GET /bounties?category=math&status=OPEN` filters mathematics, and `category=science` selects science. `q` accepts a keyword and `limit` accepts 1–100. `GET /stats` counts `OPEN` records and reports individual awards and prize pools separately.
- **Owner edits** · `POST /bounties` accepts a record defined in `openapi.json` after the Worker owner configures the `API_KEY` secret. Keep the record ID stable for corrections. GitHub issues and pull requests are the public contribution path.
- **Private Personal Intelligence** · Use the [Nathan AI Memory Bank](https://tabor-bridge.nathantaboract.workers.dev/memory-bank/) and its existing credentials for `/remember` and `/recall`.

## Build and deploy

Use Node 24. After editing `catalog.json`, update its source-check date and run `node build.js --write-seed`, then `npm test`. The build verifies that `seed.sql` matches the catalog and bundles the Worker and schema. On the first database request in a Worker isolate, D1 creates and seeds the table in an idempotent batch. Later sponsor corrections can be seeded again when their source check has a newer date.

The independent Worker runs in the account’s `nathan-tabor-platforms` dispatch namespace and binds the dedicated `nathan_global_bounties` database. The shared Tabor Bridge routes the `/global-bounties/` prefix. The GitHub workflow tests changes and deploys main-branch updates with the repository’s scoped `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` secrets.

For an authorized local deployment with the account’s Wrangler session, run `npm run build` and `npx --yes wrangler@4.135.0 deploy --dispatch-namespace nathan-tabor-platforms` in this directory. For server-to-server owner writes, configure `API_KEY` through the namespace Worker’s encrypted secret settings.

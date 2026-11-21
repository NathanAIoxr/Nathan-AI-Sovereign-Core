# Rotational Agent Mesh — 12 standalone agents, four triplets

**CONTINUE BUILDING**. Independent registry for W, M, 3 and vertically stacked-chevron families. Every node has a unique ID, role, family, state and future execution interface. This registry preserves all twelve identities without claiming that an agent role is an active bot.

The read-only Worker provides `/health`, `/api/nodes`, `/api/matrix`, and D1-backed `/api/live`. It does not expose private job payloads or credentials.

To test locally: `node --test src/index.test.mjs`. To deploy using existing Wrangler configuration: `npx wrangler deploy --config wrangler.toml`. The registry migration is additive. Connect executable agent workers only after queue, authentication, cost and lease gates are verified.

Future agent deployment requires bounded jobs, heartbeats, capacity leases, retries, per-project isolation, and receipts. Do not treat a registered row as a live worker.

# Sovereign Digital Stack

A serverless digital model for True Cloud Computing by Nathan Tabor.

| API | Mode | What runs |
|---|---|---|
| GET /health | Live service health | Reports which deployment capabilities are bound |
| GET /v1/demo | Fixed public demonstration | Four synthetic double-SHA-256 iterations and all digital models |
| POST /v1/runs/{uuid} | Protected | Runs the models with bounded inputs and stores one durable receipt |
| GET /v1/runs/{uuid} | Protected | Returns the stored receipt |

Use a lowercase version-4 UUID and bearer authorization for protected routes. POST accepts the optional query parameters `samples` from 1 to 64 and `distance_km` from 1 to 5000. Defaults are 16 and 10. Reusing a UUID and the same parameters returns the original receipt. Changing parameters for that UUID returns HTTP 409. Runtime elapsed time is a diagnostic and is excluded from the archive digest.

| Design area | Implemented base | Infrastructure still required for the full design |
|---|---|---|
| ASIC hashing, cooling, power | Actual SHA-256d over a fixed synthetic 80-byte fixture, tightly bounded at the edge | Real hashrate, power and thermal integration, and independent compute capacity are separate from this benchmark |
| Cloud and AI | Deterministic compute-slot allocation and persistent run state | Workers AI model bindings, workloads, and measured inference profiles |
| LEO, HAPS, and ground relay | Circular orbit period and an overhead vacuum path calculation | Track data, radio or optical links, gateway contracts, and a real transport adapter |
| Fiber and wireless | Idealized path propagation and free-space RF loss | Link inventory, attenuation beyond free space, and actual networks |
| Robotics, fabrication, and logistics | A single module replacement trace with spare consumption | Sensors, machine interlocks, fabrication qualification, failure recovery, and on-site controllers |
| Frontier physics | Conventional propagation baselines for comparison | Experiment-specific validated models and measurements |
| Vault and ledger | SQLite-backed Durable Objects for per-run receipts and SHA-256 over the normalized JSON serialization | R2 export, D1 projections, KV caches, Vectorize indexing, and retention operations |
| Transport and release | Authenticated HTTPS run endpoints and an Actions workflow for the software project | Queue adapters with idempotent consumers, relay services, and explicit per-hop TLS verification |

The hash implementation uses Cloudflare Web Crypto. This version has no Rust/WASM build dependency. Cloudflare executes the software on provider infrastructure. The models neither provide physical connectivity nor claim experimentally validated component performance. A digest detects changes relative to a trusted reference. Storage administrators still control retained records.

## Run and deploy

Use Node.js 24 for the local checks.

```sh
node --test worker.test.mjs
npx wrangler dev
npx wrangler deploy
npx wrangler secret put RUN_TOKEN
```

Set a strong randomly generated token of at least 32 characters. Keep it in a secrets manager. The protected routes deny access before the token is configured. Set the GitHub Actions deployment secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` for manual releases. The token needs permission to deploy this Worker and its Durable Object binding.

GitHub Actions runs software checks and manual deployment. It does not mine cryptocurrency. There are no pool URLs, wallets, submission endpoints, or background hash loops in this project.

- [Cloudflare Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/)
- [GitHub Actions product terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)

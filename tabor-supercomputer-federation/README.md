# Tabor Supercomputer Federation

Operator-facing registry for fifty logical systems. Each system has its own SQLite-backed Durable Object and a separately addressable database record. Workload attachments describe what is live, simulated, or requires a physical host. Physical processors, storage and mining equipment are provisioned separately.

| Public route | Use |
|---|---|
| / | Federation dashboard |
| /health | Cohort identity, declared slots, and binding availability |
| /v1/nodes | Node ID manifest |
| /v1/nodes/node-001 | Read an independently provisioned database record |
| /v1/nodes/node-001/matrix-demo | Run the bounded Matrix workload inside the node object |
| /v1/plan?systems=1 | Model one 450 TB system |
| /v1/plan?systems=50 | Model 50 systems |
| /v1/services | Probe the six approved internal service bindings |
| /v1/attachments | Review workload modes and provider requirements |
| /v1/bitcoin-demo | Run the existing fixed synthetic SHA-256d benchmark via the Sovereign Digital Stack |
| /v1/export | Export the intended deployment manifest. It describes desired state. Verify actual node state via the per-node records. |

## Capacity calculation

The decimal model uses 20 drives at 30 TB each. Two drives' worth is parity and one drive is a spare, leaving 17 drives' worth or 510 TB. A 10% holdback yields 459 TB modeled capacity per system, supporting a 450 TB design target before any overhead beyond that holdback. Fifty systems target 22.5 PB, with 1,000 drives, 30 PB raw, and 22.95 PB after modeled parity, spares, and holdback. Independent backup copies and their network capacity are separate. Parity arithmetic does not specify protection across chassis or sites.

The 30 TB drive is a sizing reference. Hardware qualification needs a confirmed BOM and measured capacity, throughput, rebuild impact, recovery time, and available power. For any claim of worldwide leadership, compare matching metrics and measurement dates. Storage capacity, compute throughput and mining hashrate use separate units.

## Deploy and provision

Run local tests with Node 24. Deploy within the Cloudflare account where the six service bindings are available. For a new account, configure the bindings to that account's services and verify the provider routes before exposing the endpoints.

```sh
node --test worker.test.mjs
npx wrangler deploy
npx wrangler secret put PROVISION_TOKEN
```

Use a randomly generated provisioning token of at least 32 characters. Send an authenticated POST to `/v1/provision?start=1&limit=10`, and repeat with starts 11, 21, 31 and 41. Retry individual failed batches if needed. Insert-if-absent preserves the original database record. Verify all 50 through their public read endpoints. Remove the provisioning credential when the initial cohort is complete.

The public read API returns inventory, service status and synthetic workload data. It does not accept connection credentials or expose real machine control. GitHub Actions verifies the repository. Actual Bitcoin and cryptocurrency mining requires approved hardware, power, network, and pool connections. Keep mining off GitHub Actions. The same portable manifest can be imported by a compatible registry on another provider with its own database and compute runtime.

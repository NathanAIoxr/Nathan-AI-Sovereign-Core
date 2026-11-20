# TIME ⇄ EMIT · Queue and zone bindings

| Component | Role in this system |
| --- | --- |
| Producer | EMIT publishes a versioned, stable event ID. A Worker or Durable Object can publish through a Queue binding. The canary uses the authenticated Cloudflare Queue API. |
| Push consumer | Cloudflare invokes `queue(batch, env)` on an attached Worker. Each message can be acknowledged or retried. |
| HTTP pull consumer | The external runner leases a batch. It persists the event ID in D1, then acknowledges the lease. A crash after the write can cause replay, so receipt writes are idempotent. |
| Dead letter queue and concurrency | The configured retry limit sends repeatedly failed messages to the DLQ. Concurrency is a setting for push delivery. Polling and parallelism in pull mode are controlled by the external runner. |
| Bindings and triggers | Wrangler bindings give the Worker access to its resources. Fetch, Cron, Queue and Durable Object alarms are separate execution triggers. Network latency and schedules vary. |
| Durable Objects | A stub addresses a specific object. The input gate coordinates storage operations. WebSocket hibernation lets connections survive evictions and wake the object on events. |
| Service binding and dispatcher | A service binding calls a configured Worker. A dispatch binding selects a Worker by name inside a Workers for Platforms namespace. Use explicit project routing and operator authentication. |
| DNS zone and Access | A DNS zone manages a domain's DNS and edge configuration. Orange-cloud records proxy through Cloudflare and DNS-only records resolve without that proxy. The project's dispatch namespace is its execution zone. Access can gate web entry points, and Tunnel connects an origin over outbound connections. |

## Activated Project Readers queue

- Events queue: `zone-project-readers-events`
- DLQ: `zone-project-readers-dlq`
- Receipt database: `zone-project-readers-receipts`
- Pull settings: batch size 10, 60-second visibility timeout, 5 retries
- Message contract currently supports Project Readers `CANARY` events.
- Local entry point: `node run-pull.mjs` with Cloudflare account, Queue and D1 IDs, and a credential scoped to the account, Queue consumption and D1 writes. The runner executes one bounded batch.

A live duplicate-message test confirmed exactly one D1 receipt for the replayed event ID. The HTTP consumer is attached. A recurring poller, reader report event contract and dispatch entry point are separate work and currently inactive.

Official references: [Queues pull consumers](https://developers.cloudflare.com/queues/configuration/pull-consumers/) · [Dynamic dispatch](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/dynamic-dispatch/)

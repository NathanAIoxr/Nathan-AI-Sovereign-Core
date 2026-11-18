# Nathan AI — Global Infrastructure Atlas
Updated: 2026-11-18. This additive package does not replace existing Nathan AI apps, worker registries, or automations.

## Coverage
The public read-only Cloudflare Worker indexes **18 layers** from physical connectivity and pre-OS firmware to agents, bots, messaging, IoT, decentralized nodes and observability. Each seed component has a **reference-only status**: no claim of installation, authorization, ownership, or live network presence. The complete separately produced research export contains **871 public-reference components** and preserves the preceding 205-repository catalog. This Worker is a smaller initial operational seed, designed for expansion after individual review.

## API
- `GET /health` or `/` — service status and reference counts
- `GET /api/layers` — all infrastructure layers
- `GET /api/components?layer=L11&q=agent&limit=50` — bounded catalog search
- `GET /api/edges` — architecture-only relationships
- `GET /api/sources` — public reference directories
- `GET /api/summary` — coverage, limitations

## Relationships to existing platform
Existing Cloudflare resources remain unchanged. Use verified service bindings, D1 metadata, and Queue consumer registrations only after inspecting their current schema and access permissions. Kernel projects, BMC/firmware, cloud-hosted broker clusters and IoT gateways are **not** Cloudflare Workers and cannot be bulk-deployed into a Worker runtime. Third-party licenses, dependency provenance and compatible execution environments must be checked before any import. No mass host scans, external infrastructure interjection, unbounded replication, or externally hosted code execution are part of this implementation.

## Build validation
`node --test app-factory/nathan-ai/global-infrastructure-atlas/index.test.mjs`
Scheduled GitHub Action validates this package hourly. The existing Nathan Fleet Builder automation continues approved integration batches.

## Existing account snapshot
At first integration review: Cloudflare **440 Worker scripts, 50 D1 databases, 9 KV namespaces, 6 R2 buckets, 10 Queues and 5 Workflows**. Counts are a point-in-time inventory, not proof of all components working. The repository had 4,865 tracked files/directories. No private IDs or secrets are published here.

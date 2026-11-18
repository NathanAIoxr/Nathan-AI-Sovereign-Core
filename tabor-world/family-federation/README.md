# Tabor Family Federation

The public directory connects the workflows in NathanAIoxr/Nathan-AI-Sovereign-Core to the Cloudflare bot and agent families listed in the source inventory. The release takes eligible deployed bot, agent, swarm, and hive Worker identities from the Cloudflare account inventory. GitHub workflows, deployed Worker identities, fleet agents, and rotational agents retain their source types and state labels.

A snapshot with both families creates three logical assignments for every source record: **Build**, **Verify**, and **Relay**. Each assignment references an opposite-family counterpart. Identifiers derive from the parent and role. Repeated ingestion cannot multiply the derived records again. These assignments are registry entries. The existing Workers and workflow jobs continue to run in their own projects.

The page opens its directory after **One into Zero → right 360° → right 360° → left 360° × 4**. It is a visual interaction for the public directory. The API gives the same snapshot directly.

| Endpoint | Purpose |
| --- | --- |
| `/api/status` | Source counts, total assignments, and digest |
| `/api/roster?offset=0&limit=24` | Paged entries with counterparts and assignments |
| `/api/snapshot.json` | Full source snapshot |
| `/api/connections` | GitHub Actions link and live Cloudflare service checks |
| `/api/federation.bin` | Binary snapshot header and SHA-256 |
| `/api/audit` | Snapshot integrity and 3× count check |
| `/api/lock` | Opening sequence and transition status |

## Binary packet v1

The 52-byte packet starts with the four ASCII bytes `TFED`. Byte 4 is version 1. Byte 5 gives the seven command bits. Byte 6 contains them from the most significant bit: `1110000`, followed by padding. One marks insertion at the start and a right rotation afterwards. Zero marks a left rotation. Byte 7 gives assignments per source record. The unsigned big-endian 32-bit quantities at offsets 8, 12, and 16 are GitHub, Cloudflare, and total source counts. Offsets 20–51 hold the SHA-256 digest of the full JSON snapshot. Role codes are `00` Build, `01` Verify, and `10` Relay.

## Operations

Run `npm test`. Apply `schema.sql` to `REGISTRY` before deploying with Wrangler. The 15-minute Cron reads public GitHub workflow metadata with pagination and two existing D1 agent tables. The deployed Worker inventory is a release snapshot with its own observation date. A failed refresh keeps the previous complete snapshot. Use `node verify-live.mjs` to check the public deployment and decode its packet.

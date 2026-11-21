# NUTSY · Super 2X and Hypercomputer federation

Run the first receipt on NUTSY from this checkout. The hostname check confirms which machine actually ran the connector.

```sh
python3 integrations/nutsy/federation.py --expect-host nathan-1 \
  --filesystem /opt/conductor --output ~/.local/state/nutsy/federation.json
```

The receipt identifies the OS, kernel, CPU count, system memory, and the filesystem serving Conductor. It reads the existing Cloudflare endpoints with bounded HTTPS requests and records source integrity hashes. Exit 2 means an endpoint failed or the federation's manifest count differed from its assigned task count. The receipt still records which sources responded. Host measurements remain local.

| Existing layer | What the connection reports |
|---|---|
| Tabor Supercomputer Federation | Individual node IDs and aggregate assigned, verified, and pending receipts from the SQLite-backed logical units |
| Nathan AI Rocket Cloudflare mount | Super 2X and Hypercomputer reservations from the GitHub policy, plus enrollment and heartbeats from Cloudflare |
| DMSP + DIT | Public department definitions from the existing registry |
| Ubuntu | The actual operating system, CPU, RAM, and disk of the machine running the connector |
| 3.14 and 1.618 | Exact design-anchor literals, separate from measured capacity and performance |

The two Rocket reservations and the runnable Durable Object cohort have separate identities. The available registries do not supply a per-slot mapping between them. Adding such a mapping requires an actual deployment or enrollment receipt for the corresponding slot. Do not infer that equal counts identify the same systems. The existing [2X+ FP64 release](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/323) supplies bounded workload execution separately from this inventory view. The [hardware crosswalk](recovered-sources.json) links the physical references and digital models.

The first successful on-host receipt establishes an outbound connection from NUTSY, using its existing network. The Conductor's review interface and queue remain the path for approved operational dispatches. For tunnel-backed inbound access, first restore the connector on the Ubuntu host, then verify a live Cloudflare connection. See [job recovery](JOB-RECOVERY.md).

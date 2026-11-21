# Tabor Super 2X + Hypercomputer server kit

Run the kit on Linux using Python 3.10 or newer. Start from the GitHub checkout or extract the release kit and work from its directory. The local run uses only the Python standard library and no vendor account.

```sh
python3 integrations/nutsy/portable.py --benchmark
```

On the server, visit `http://127.0.0.1:8787/`. The first run measures the Linux host and runs the bounded existing Sovereign integer replay if requested. Add `--tabor-cloud` to fetch the public Tabor Cloudflare receipts and inventory. Use `--collect-only` for receipt generation without a web server. `--state-dir` selects where this instance stores its local receipts. The portal reads the current receipts when refreshed.

## AI program integration

| HTTP route | Result |
|---|---|
| `GET /openapi.json` | OpenAPI 3.0 description for clients that support importing HTTP actions |
| `GET /api/status` | Server resource dimensions, cloud observations, compute profile and queue counts if available |
| `GET /api/catalog` | Source-linked Tabor inventory with reservation, verification and release evidence |

A program that supports local HTTP can read the two JSON routes directly. A browser can use the same interface without an AI program. Vendor-hosted AI clients may require an authenticated connector or private proxy because localhost refers to the machine on which the client runs. The local API has read-only routes and no agent, shell, deployment, enrollment or dispatch endpoint. The existing Conductor dispatch workflow remains separate. The kit uses loopback for the owner trial.

## Fleet evidence

The 1,000 Super 2X slots and 1,000 Hypercomputer slots come from two policy pools. The Cloudflare logical cohort reported 1,000 verified task receipts. The available records do not establish a slot-to-node mapping or enrolled physical capacity for those two pools. Enabling the public Tabor provider reads its catalog and federation status. Local benchmark work runs on the server starting the kit.

The inventory links Tabor Chips, the digital hardware families, the NVIDIA references, DMSP + DIT, Cloud Slayer, the Supercomputer workload releases, the Labs recovery catalog and the independent app stations. Use the linked source for each independent release or source archive. Owner receipts stay with the local instance.

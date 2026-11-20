# Nathan AI Full-Spectrum Autonomous Sovereign Engine

This package extends NathanAIoxr/Nathan-AI-Sovereign-Core with the four doors from Nathan Tabor's blueprint.

| Door | Entry point | Result |
| --- | --- | --- |
| The Immune System & CI Reflex | [GitHub Actions](../../../.github/workflows/conductor-node-template.yml) | A repair packet for a failed first-party main-branch run, with source SHA, failed job IDs and a verification plan. |
| The Storage & Ledger Governor | [Cloudflare Worker](worker.mjs) | A batched metadata ledger with a per-shard UTC write budget, digest-based routing and a private R2 overflow copy. |
| The Logic & Forging Gate | [Local intake](organism.py) and [Conductor Lasso release gate](../release-gate/) | Worker, schema or Python candidate packets. The builder supplies evidence and the Lasso gate controls release to its declared destination. |
| The Sensory & Swarm Edge | Hop In Chatbox and Voice Box text exports | Owner-only SQLite intake, atomic work claims, expiring leases and an outbox that retries until D1 acknowledges a matching seal. |

## Intake and handoff

Export a text item from Hop In Chatbox or Voice Box. The source file stays in place. Run on the node that owns the intake database.

```sh
python3 organism.py enqueue voice-box /path/to/export.txt
python3 organism.py stage worker /path/to/private-candidate.json
python3 organism.py finish JOB_ID LEASE verified /path/to/review-evidence.json
python3 organism.py flush
```

Registered fleet nodes can also use the existing [Conductor node template](../node-template/) to submit release evidence with their scoped node credential. The staged file stays local.

The candidate file holds the original text, job ID and lease. Keep it private. Use `schema` or `python` for those candidate types. `claim` is available for a local tool that reads the job directly. A claim expires after 15 minutes. Subsequent nodes or processes using the same local database can reclaim it. Use a separate database per device.

Run the checks in the staged packet against the resulting artifact and use the existing Lasso release gate before release. Use `rejected` for a rejected candidate. The `finish` command records the submitting operator’s verdict and the digest of its evidence. A digest identifies exact bytes. The CI job files the repair packet for review and leaves publishing to the existing release path. The native apps can feed the queue through text exports. Direct in-app intake and automatic model coding are future integrations.

## Cloudflare receipt service

Send `POST /api/sovereign-engine/receipts` with `Authorization: Bearer ENGINE_TOKEN` and `Content-Type: application/octet-stream`. The body starts with these exact 18 raw bytes at offset zero and continues immediately with a UTF-8 JSON array of 1–20 receipts.

```text
AA 55 FF 01 31 2B 31 3D 32 7E 31 2D 31 3D 30 04 00 F0
```

The left-to-right frame carries `1+1=2` and `1-1=0`. The rails reduce to XOR checksums `24` and `20`, with combined seal `04`. The gate compares all 144 bits against the fixed bytes before writing. The one-byte seal is XOR parity. The bearer token controls access, and each receipt keeps its own SHA-256 seal.

Use `python3 verify_144bit_anchor.py frame.bin` to verify a standalone raw frame. It prints `1+1=2` and exits 0 for the canonical 18 bytes. Any byte change or extra byte returns `1-1=0` and exit 1.

Each item contains `source`, `verdict`, `input_sha256` and `evidence_sha256`. Run `flush` with the matching `ENGINE_TOKEN` in its environment. The Worker stores no raw transcripts, stderr, generated code or local file paths. [Public readiness](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/sovereign-engine/health) reports bindings and the running release.

- `committed` and `already_committed` acknowledge the receipt in D1.
- `buffered` means R2 holds a copy and the sender should retry D1 later. `deferred` means keep the local pending copy and retry later. R2 retains buffered copies as audit evidence.
- The default budget is 1,000 receipts per shard, measured in UTC. The budget counter and receipt insert commit together. This service budget is separate from the account's D1 row-write quota, which includes index and budget writes. Keep both configured shard bindings and their order stable. Migrate existing receipts before changing the shard mapping.
- The Worker stores the metadata seal. It records no attestation that a patch was built or deployed. A CI triage receipt only establishes that its metadata packet was produced.

Apply `0001_receipts.sql` to both engine D1 bindings and configure `ENGINE_TOKEN` as a distinct encrypted Conductor secret. Use the existing [Conductor release procedure](../README.md#release) to deploy the route and its bindings. Set `RELEASE_SHA` to the deployed source commit.

The Conductor exposes `/api/handoffs/sovereign-engine` and the receipt service on its existing mount after deployment. No separate Worker slot is needed.

## Verify locally

```sh
node --test worker.test.mjs ../release-gate/release-gate.test.mjs
python3 -m unittest discover -p 'test_*.py'
```

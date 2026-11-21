# ULCAS · Node X

Nathan Tabor’s 12-lane bidirectional figure-eight. Six forward lanes cross X toward registered operations. Return observations cross X under a different producer identity. Node X writes a lane 12 receipt for an outbound result or matched CI result.

## Current runtime

| Lane | Implemented behavior |
|---|---|
| 1 | Probe an allowlisted systemd unit. An inactive unit fails the check. Restart requests are recorded for approval. |
| 2 | Record GitHub proposals awaiting approval. Register a verification CID and commit SHA, then reconcile a matching authenticated CI result. |
| 3 | Probe one configured HTTPS endpoint with a timeout and no redirects. Edge changes are recorded for approval. |
| 4 | Return local load and disk capacity observations. |
| 5 | Validate a typed JSON service manifest. Apply requests are recorded for approval. |
| 6 | Append evidence digests and the hash of each outbound intent. |
| 7–11 | Accept scoped alert, CI, edge, pulse and drift events with typed fields and durable deduplication. |
| 12 | Write internal reconciliation receipts. Callers cannot inject a lane 12 result. |

A valid forward packet records `forward_hit_x`. A valid producer submission records `reverse_hit_x`. CID or SHA conflicts return `quarantined`, invalid authenticated inputs return `fix_and_resubmit`, and permission failures on an authenticated route return `discarded`. Rejected bodies are discarded. The ledger records disposition metadata. Requests without credentials stop at authentication.

The Python 3.12 standard-library service replaces the supplied Go process for this implementation. Mutating intents enter `awaiting_approval`. This build has no approval UI or mutation executor. The config validator accepts the documented JSON structure. It has no general YAML or Ansible executor. The edge helper preserves its wrapped origin response and sends a sampled observation. It does not source WAF decisions.

## Run and integrate

1. Run `python3 -m unittest discover -s deployments/conductor/ulcas -v` from the repo root.
2. Provision a dedicated `ulcas-node-x` user and group. Install the Python files to `/opt/ulcas-x`. Install the included systemd units under `/etc/systemd/system`.
3. Have root provision `/etc/ulcas-node-x/node.env` and `pulse.env` as mode 0600 files. Set distinct random ASCII values of at least 32 characters for `ULCAS_OPERATOR_TOKEN`, `ULCAS_LEDGER_KEY`, and each enabled producer token (`ULCAS_ALERT_TOKEN`, `ULCAS_CI_TOKEN`, `ULCAS_EDGE_TOKEN`, `ULCAS_PULSE_TOKEN`, `ULCAS_DRIFT_TOKEN`). Include only the pulse token in `pulse.env`. Set `ULCAS_UNITS` to a space-separated service allowlist, `ULCAS_REPO` to the registered repository and `ULCAS_EDGE_HEALTH` to its operator-selected HTTPS health endpoint.
4. Start the service and heartbeat timer. Node X binds to loopback port 8072. For remote ingress, use a named tunnel and Cloudflare Access. Test authenticated access and rejected unauthorized access before enabling GitHub or Worker producers.
5. When ready, install `close-loop.yml` under `.github/workflows/` and set its ingress and access secrets. Dispatch it from the registered main branch at the same commit pinned in the existing `github.verify` crossing. The workflow serializes JSON via jq and passes input via environment variables.
6. Wrap the existing edge handler with `withUlcasTelemetry` when edge telemetry is required. Set the ingress URL and its scoped token in the Worker. Configure a sample rate appropriate to the origin.
7. Poll `GET /x/oncoming?after=0&limit=25` with the operator token, then advance the cursor to the highest processed sequence. Retrieve a crossing history from `GET /x/ledger?cid=...`.

Example drive body: `{"cid":"verify-0001","intent":"github.verify","target":"NathanAIoxr/Nathan-AI-Sovereign-Core","arguments":{"expected_sha":"<40 lowercase hex characters>"}}`.

The generic events are in `ulcas_events`, separate from the scroll ledger. Event hashes chain sequentially. `POST /x/checkpoint` authenticates a Merkle root for up to 256 new events using HMAC-SHA256 and a distinct key. Store checkpoints externally if you need to detect database rollback. A holder of the signing key can produce a signature. This is symmetric authentication and the SQLite triggers do not make the database immutable against its owner.

[Next project: human words to backend plans](INTENT-COMPILER.md).

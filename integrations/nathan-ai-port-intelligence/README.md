# Nathan AI 🚀 — Port Intelligence

## Deployment
Cloudflare Worker: `nathan-ai-port-intelligence`
GitHub branch: `feature/tabor-101-worker-registry-20261118`
Deployment version: 1.2.0

## Public endpoints
- `GET /health` — service status, KV/auth binding presence
- `GET /status` — feature flags
- `GET /ports` — common port reference data, not live observations
- `GET /schema` — expected report structure

## Private endpoints
- `POST /reports` — authenticated submission of authorized assessment reports
- `GET /reports/{assessment_id}` — authenticated retrieval

Both private endpoints require a secret binding named `REPORT_API_TOKEN`, configured through Cloudflare Secrets, and a KV binding named `REPORTS`. When the secret is missing, private endpoints fail closed (503). Do not commit the secret to GitHub or send it in chat.

## Example report (synthetic, no live host)
```json
{
  "assessment_id": "demo_authorized_001",
  "authorization": {
    "owner_or_authorized": true,
    "scope_description": "Synthetic validation example"
  },
  "findings": [
    {"host": "example.invalid", "port": 443, "protocol": "tcp", "state": "unknown"}
  ]
}
```

The authorization field is a self-attestation and is **not independently verified** by the Worker. Results are user-supplied; the Worker does not scan, probe, or access any network targets. SHA-256 digests establish integrity of submitted data, not the truth of the underlying claims.

## Remaining prerequisites
1. Set a high-entropy `REPORT_API_TOKEN` through Cloudflare's secret management. Share it only with authorized clients.
2. Test the live /health, /schema and authenticated report endpoints from a network with DNS access.
3. Add production-grade authentication, abuse protection, retention rules, audit logging, and KV concurrency safeguards before handling sensitive data.
4. Define and verify owned/authorized scan targets before integrating any separate assessment runner.
5. Use a trusted runner in an authorized environment for actual port measurements; Cloudflare Workers do not support general-purpose raw TCP SYN scanning.

## Operational boundaries
No global internet scanning, third-party SSH probing, vulnerability exploitation, autonomous replication, or external-system intrusion is included.

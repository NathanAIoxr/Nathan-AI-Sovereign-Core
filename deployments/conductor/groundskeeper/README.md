# Groundskeeper AI · Collyn Phillips Tabor

[Open Groundskeeper AI](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/groundskeeper-ai) · [Conductor registration](app.json)

Nathan Tabor’s Groundskeeper design assigns Collyn the infrastructure and technology role. The October 2, 2026 project brief names hardware, software, networks, system architecture, communication, data, security, redundancy, continuity, and the foundation. Its questions are “DOES THE SYSTEM WORK?” and “WILL IT KEEP WORKING?” This Worker implements the project role. It uses the authored project brief and the owner’s corrected spelling. [Lasso of Truth](../release-gate/)

## Conductor operations

The Groundskeeper reads an explicit list of five Nathan AI health routes through its Cloudflare dispatch binding. Each public response must identify the correct service and its 40-character source revision before it can show as ready. The separate continuity panel reads the existing Conductor TIME receipt. A current receipt has a recent observation, a future alarm and recorded pass counts. Each observation includes its public source URL and the SHA-256 digest of the JSON bytes observed. Unreachable sources carry an empty digest. These checks provide observations at request time. They cover the listed software endpoints and scheduled zone checks.

| Route | Operation |
| --- | --- |
| `GET /api/health` | Worker readiness and GitHub release |
| `GET /api/status` | Public service observations and continuity receipt |
| `GET /api/stage` | Frozen report candidate for independent review |
| `POST /api/release` | Return the exact report only upon a valid Lasso decision |

Stage a report, review its observations and source references, and use the existing authenticated Conductor attestation route with the staged `candidate` and review. Send `{candidate, permit}` to the Groundskeeper release route. The Lasso binds the approval to the exact bytes and `groundskeeper-ai` destination. The response carries the report and its approval digest on a pass. A failure returns a zero receipt without the staged report. The Worker performs no repairs or permanent publication. [Conductor attestation contract](../release-gate/README.md)

The runtime needs `PLATFORM`, the `nathan-tabor-platforms` dispatch binding, and `RELEASE_SHA`. The cockpit allowlist mounts this dedicated Worker. Run `node --test deployments/conductor/groundskeeper/groundskeeper.test.mjs` for local verification and `node deployments/conductor/groundskeeper/verify-live.mjs <release-sha>` for the deployed smoke test.

# Conductor fleet status

This worker extension reads two existing D1 sources on a five-minute schedule. It publishes only source-level counts and freshness. The sources can succeed independently. A stale reading is labeled and can be replaced by a fresher reading from the peer relay.

Source bindings: WORKER_CATALOG reads the published worker definitions. FLEET_REGISTRY reads observed workers, declared agents and bots, repository references, evidence rows, logical slots, and verified telemetry node counts. Compare source counts individually because catalog definitions can overlap runtime records.

Worker routes: /conductor for gateway reachability, /conductor/status for the gateway JSON, and /conductor/fleet for the federated counts. Peer snapshot routes read only the local Worker store. Existing Worker routes are dispatched through original.mjs, which is the pre-existing entrypoint module for each target Worker.

Public results:
- https://nathan-ai-public-status.nathantaboract.workers.dev/conductor/fleet
- https://tabor-ext-100-uptime-probe.nathantaboract.workers.dev/conductor/fleet

This publication path reports availability of the two catalogs. Runtime deployment, node enrollment, and job execution use existing Conductor controls.

# Independent project staging vaults

Every existing project in `zones_registry` receives a separate `project_staging_vault_v1` record. Components are associated only when their source relationship is verified. This is a **logical project vault**, not a Cloudflare DNS zone, a database clone, or a private storage bucket.

Initial verified state: 25 project vaults, 30 component association rows, 0 real DNS zones. `launch_approved=0` for all records. Existing staging URLs may still be publicly accessible: metadata HOLD is not a security boundary.

A project vault can eventually contain separate versioned manifests for source, D1 schema/data exports, R2 assets, Pages deployments, Worker bindings, secrets references (never secret values), queues, routes, Access policy, and launch checks. Do not infer a component-to-project relationship from a shared account alone.

To create a real zone, supply and verify a controlled domain; do not create synthetic domains or change nameservers without authorization. Use Cloudflare Access or authenticated preview gating for actual private staging. Launch requires explicit approval and successful verification.

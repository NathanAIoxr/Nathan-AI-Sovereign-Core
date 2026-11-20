# Nathan AI sparse HOLD zone integration
Each Omni GOD and SUPERNODES identity resolves to a separate logical HOLD manifest. No DNS spoofing, fabricated domains, or billions of running Workers.
## Existing source
- holding-zones.js exports zoneFor(namespace,id), launchEligibility.
- conductor-adapter.js provides the conductor contract.
- zone_dispatcher.js is an additive library; it is **not** yet wired into the running Cloudflare Worker.
## Prerequisites
Create an isolated staging D1 database, KV namespace and queue in the authorized Cloudflare account, then bind as ZONE_DB, ZONE_KV, EMIT_BUS in the **existing** authorized conductor deployment. Set KILL_SWITCH_ACTIVE to '0' only after staging checks; absent means fail closed.
Apply schema_holding_zones.sql to staging with wrangler d1 execute <STAGING_DB> --file=./schema_holding_zones.sql --remote. Never run against production without backup/review.
Use authenticated, owner-approved control endpoints; do not expose staging/dispatch/launch endpoints publicly. Verify the real deployment and route before recordVerifiedLaunch. Consumer must independently validate each approved URL and restrict redirects, private addresses, credentials, request size and rate.
## Gate
HOLD -> REHEARSAL -> READY_FOR_SWITCH -> LAUNCHED, with independent reviewers and explicit owner approval. Rollback is compensating recovery, not guaranteed zero data residue. Cloudflare KV propagation is not instantaneous.
## Reality check
GitHub source commits are not live Cloudflare deployments. Existing Worker limit: 500; reuse an authorized Worker without overwriting unrelated services. Cloudflare DNS zones require registered domains. Clouder iOS app is separate and not changed by this code.

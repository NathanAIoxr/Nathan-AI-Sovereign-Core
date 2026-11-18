# 1,000-node federation provisioning runner

This uses the **existing** deployed `tabor-supercomputer-federation` POST `/v1/provision` endpoint and its existing `SupercomputerNode` Durable Object class. It does not replace Worker code.

1. Provide `FEDERATION_URL` (authorized deployed Worker origin) and `PROVISION_TOKEN` (the existing provision secret) as environment variables. Do not commit credentials.
2. Run `node integrations/tabor-1001-provision/run.mjs` from an authorized environment. Optional `START_NODE` and `END_NODE` allow bounded/resumable ranges.
3. Save receipts, inspect failures, and verify GET `/v1/nodes` or per-node endpoints. A successful provisioning response confirms initialization, **not** dedicated CPU/RAM/disk allocation.
4. Keep the main control plane `main-000` logically separate. The existing federation uses `node-001` as its lead **member**, not the new main control plane.
5. The user reports a $25 Cloudflare plan; plan entitlement and resource limits are not independently verified.
6. The 1ms firing target is a logical clock specification; Durable Object alarms and Cloudflare request handling cannot guarantee a 1ms physical execution interval.

No automatic execution of this script is asserted until actual provision receipts are collected.

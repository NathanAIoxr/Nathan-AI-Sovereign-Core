# Nathan AI Conductor — account participant handshake

**Account-scoped registration completed in Cloudflare D1** `nathan-ai-global-catalog.nathan_conductor_participant_registry`. This file mirrors the account inventory in GitHub. No remote invitations or code execution have been sent.

| Participant | Independent project | Cloudflare worker | State |
|---|---|---|---|
| conductor-core | sovereign-conductor-bridge | — | SOURCE_VERIFIED_HOLD |
| mining-lab | bitcoin-sha256d-mirror | nathan-ai-mining-lab | WORKER_EXISTS_HOLD |
| mining-hub | sovereign-multi-axis | tabor-corp-mining-hub | WORKER_EXISTS_HOLD |
| coin-registry | sovereign-coins-21 | nathan-ai-crypto-64 | WORKER_EXISTS_HOLD |
| tabor-bridge | integration-bridge | tabor-bridge | WORKER_EXISTS_HOLD |
| taborpool | taborpool | — | INVITATION_STAGED |
| taborboy | taborboy | — | INVITATION_STAGED |

The Conductor source at `app-factory/nathan-ai/sovereign-conductor-bridge/src/conductor.mjs` is an offline-capable deterministic HOLD module; it does not implement authenticated remote invitations or deployed inter-Worker RPC.

## Required to activate
1. Confirm source and test status independently for each project.
2. Establish an authenticated account-owned service binding or queue route to the Conductor.
3. Register only specifically authorized agents and compute resources; require signed identity, bounded permissions, and revocation.
4. Use separate per-project budgets, retry limits, kill switches, and observable logs.
5. Enable deployments individually after checks; do not launch all 500 existing Workers or run crypto mining on CI or unauthorized infrastructure.

**No live mining, third-party agent invitations, or universal deployment were executed by this registration.**

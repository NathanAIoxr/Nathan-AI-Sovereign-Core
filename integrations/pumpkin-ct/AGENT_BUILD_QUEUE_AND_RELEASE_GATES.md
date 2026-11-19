# Pumpkin Patch + CT Inc. + Diné: bounded build-agent work queue
Status: staged, review-first. Preserve each independent application. No autonomous self-replication, external host recruitment, unapproved paid resources, or unrestricted deployment.

## Agent lanes
| Lane | Input | Deliverable | Validation |
|---|---|---|---|
| ARCHIVE | original chat export and files | exact source chunks, sha256 manifest, completeness ledger | byte-for-byte readback |
| CORE-FLEET | existing Pumpkin Driver/Volunteer/Network code | 4h SLA, delivery proof, HOS-aware state machine | fixtures and integration tests |
| FINANCE | tier engine and actual vendor agreements | money-off/back accounting, refunds, receipts | cent-accurate reconciliation |
| CHURCH-OS | CT Inc. source | events, bulletin, opt-in messaging and giving UI | authorization and accessibility |
| WHITE-LABEL | existing independent apps | tenant router, DNS proof, per-module toggles | cross-tenant isolation tests |
| DINÉ | library HTML and existing Diné module | provenance-based recipes, history, agriculture and classroom assets | source and cultural-rights review |
| FUN | existing independent game repositories | game modules and festival catalog links | game-specific tests |
| SECURITY | all code | privacy, consent, secrets, webhook verification | tests, audit and rollback plan |
| RELEASE | approved passing PRs | staging deploy, smoke tests, production release proposal | explicit human approval |

## Queue protocol
Each issue has: source_file, exact_source_range, owner, status, claim_token, claimed_at, lease_expires_at, retries, branch, PR, tests, verification, rollback, next_action. Claims use a D1 transaction/conditional UPDATE with lease expiry; never assume a worker owns work merely because it read a row. Only a verified worker may write. One bounded task per claim, no fan-out without quotas. Limit retries and use dead-letter queue. Record all operations in append-only audit table.

## Release gates
- Code review and tests before merging.
- No live financial charges, SMS, calls, donations, domain provisioning or public cultural publication without explicit account/organization approval.
- Preserve source wording in immutable archive; label derivative interpretation.
- No automated migration on Worker boot. Use reviewed versioned migrations.
- Never claim Cloudflare production success until deploy, endpoint readback and functional smoke tests succeed.
- Do not claim a full transcript archived until every original source file and message hash is matched.

## Work order
1. Read existing code, migrations and project registry; inventory overlaps.
2. Run Python unit tests and TypeScript checks; record failures and smallest fixes.
3. Import exact chat export when available; keep gap status visible.
4. Build staging-only tenant router with authorization, module gating, audit and domain verification.
5. Build read-only catalog and educational APIs from verified content.
6. Implement carrier and finance integration with sandbox credentials.
7. Add consumer-first PWA, opt-in voice/SMS and accessible controls.
8. Stage preview, review, test, deploy only after approval.

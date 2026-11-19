# Nathan Tabor — DMSP + DIT operating model

## Thesis
Move from **repair after failure** (legacy IT) to **proactive management** (MSP) to a **verified digital operating system for IT outcomes** (DMSP + DIT). A claim is not an outcome: every authorized action needs a ticket, owner, evidence, approval where required, and a post-action verification receipt.

## Three delivery modes
- **DMSP**: outsourced services for independently contracted customer tenants.
- **DIT**: an organization's internal digital IT department with its own asset and user inventory.
- **CO_MANAGED**: shared provider/internal responsibility, with clear RBAC, escalation and contract ownership.

## Isaiah 45:7 role alignment

DMSP **DAEMONS** run the authorized work below. DIT **Angels** verify source, consent, recovery, and outcomes above. WILL authorizes scope, WHEEL schedules approved work, and the Challenger submits testable objections. The verified operating view presents records supported by receipts.

[Role registry](../../../projects/sovereignty-os/duality/roles.json) · [Live Isaiah 45:7 view](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/assessment-studio/#alignment)

## Operating departments — 28
1. Digital Help Desk — support, tickets, triage, escalation, knowledge.
2. Digital Network Operations (NOC) — uptime, network/service capacity, network health.
3. Digital Security Operations (SOC) — security alert triage and incidents.
4. Cloud Operations — Workers, databases, infrastructure and SaaS cloud.
5. Endpoint Management — managed laptops, servers, phones and patch compliance.
6. Identity and Access — SSO, MFA, access reviews and offboarding.
7. Backup and Recovery — backup assurance, restore drills, evidence.
8. DevOps and Automation — code, GitHub, CI/CD and changes.
9. Compliance and Risk — policy, exceptions, controls and audit evidence.
10. Digital CIO / CTO — budgets, architecture, roadmaps and priorities.
11. Client Success — communications, SLA reporting and service reviews.
12. Finance and Operations — contracts, subscriptions and unit economics.
13. Asset and Software Lifecycle — CMDB, license management and warranties.
14. Network Engineering — routing, DNS, switching and Wi-Fi operations.
15. Business Applications — SaaS applications and user workflows.
16. Data and Analytics — retention, governance, reporting and quality.
17. Observability and SRE — service metrics, alert tuning and error budgets.
18. Integration Engineering — provider integrations, APIs and event routing.
19. Platform Engineering — infrastructure templates and developer platform.
20. Knowledge and Training — runbooks, SOPs and user enablement.
21. Onboarding and Offboarding — client and employee lifecycle workflows.
22. Vendor Management — vendor accountability, renewals and third-party risk.
23. Procurement — equipment, purchasing and subscriptions.
24. Automation Verification — execution approvals, rollback and receipts.
25. Major Incident Command — critical incidents, stakeholder communications and postmortems.
26. Privacy and Data Protection — data minimization, retention, permissions, deletion.
27. Quality and Release Assurance — automated checks, testing, deployment gates.
28. Field Services — consented onsite work and physical logistics.

## Services beyond conventional MSP offerings
| Legacy break-fix | Typical MSP | Nathan Tabor DMSP + DIT target |
|---|---|---|
| Incident dispatch | Proactive monitoring | Business-impact-aware prevention with proven outcomes |
| Hourly/project billing | Monthly support plans | Scope and value metrics with contract transparency |
| Best-effort repairs | Response SLAs | Documented response, escalation, restoration and verification |
| Occasional backup | Managed backup jobs | Recorded restoration drills, RTO and RPO evidence |
| Manual device lists | RMM inventory | Authorized per-tenant inventory, lifecycle and ownership |
| Technician judgment | Scripts and standard tools | Approved runbooks with human checkpoints and rollback |
| Separate IT tools | Integrated RMM + PSA | Auditable cross-department service workflows |
| Periodic reporting | Dashboard reporting | Business value, risk trends, unknowns and exceptions |

## What standard MSPs often should do better
1. Test restoration instead of treating successful backups as recoverability.
2. Remove recurring incident causes, not only close tickets.
3. Verify patches and fixes after deployment; keep evidence for each change.
4. Distinguish missing telemetry from a healthy system.
5. Review vendor and software supply-chain exposure.
6. Audit offboarding, third-party access and privileged credentials.
7. Measure actual service outcomes and customer business impacts.
8. Prove SLA metrics against shared definitions and publish exclusions.
9. Enforce customer permissions before monitoring, collecting telemetry or automating.
10. Provide a safe human override and rollback for major changes.
11. Reduce noisy monitoring with deduplication and incident context.
12. Maintain an independent change/audit history and disaster playbooks.
13. Develop accessible user self-service and user training.
14. Track application dependencies, ownership, lifecycle and license costs.
15. Build co-managed responsibility matrices for internal/external teams.
16. Budget capacity and technical debt before they cause outages.

## System architecture
```
Customer or internal IT team
  -> Identity / Cloudflare Access (required for customer operations)
  -> Tenant-scoped DMSP + DIT Cloudflare Worker API
  -> D1: departments, tenants, tickets, assets, audits, checks, runbooks
  -> Approved connectors (Cloudflare, GitHub, endpoint/RMM, ticketing, backup, SaaS)
  -> Queue/Workflow: rate-limited authorized jobs and verification receipts
  -> Evidence, dashboards, reports, invoices and escalation
```

Cloudflare Workers supplies edge HTTP APIs, D1 is the current relational state store, and GitHub is the source-control / review / CI system. Actual customer systems and agents must be explicitly enrolled; public cataloged tools are not installed software or managed client assets. `nathan-ai-dmsp-dit` D1 exists with 28 department rows. Zero current tenants/tickets were verified during this build.

## Public release endpoints
- `/` informational portal
- `/healthz` database connectivity and private-API configuration state
- `/api/public/departments` read-only D1 department directory
- `/api/public/services` read-only service catalog
- `/api/public/gaps` improvement priorities
- `/api/public/comparison` three-generation comparison

## Private API source (locked until configured)
Existing protected: `/api/tenants`, `/api/tickets`, `/api/overview`, `/api/actions`. The shared-operator `DMSP_ADMIN_KEY` must be provided as a secret for authorized administrative access. **Do not distribute this key to customers.** Before self-service is enabled: integrate signed identity and roles, tenant authorization on every DB path, validation, pagination, quotas, CORS/CSRF as appropriate, and security regression tests. All customer write actions are disabled without a valid admin key.

## Deployment and verification rules
- `GIT`: source commit + branch/PR is not a deployment.
- `WORKER`: API upload and enabled workers.dev route are not proof a customer can reach HTTP.
- `DATABASE`: a created table/row is not a monitored client or live technician.
- `MONITOR`: online means successful real check; missing data is UNKNOWN.
- `WORKFLOW`: queued != running != completed != verified outcome.
- No scanning of non-owned infrastructure, no implicit remote admin, no agent self-replication.
- Critical/destructive changes require explicit human approval; every completion must have a receipt.

## Launch stages
1. **Now:** 28 departments and read-only service portal, code in review branch, D1 seeded, Worker upload and route enabled.
2. **Security:** Cloudflare Access, MFA, roles, secrets, tenant isolation tests, rate limits, abuse monitoring.
3. **Operations:** integrated tickets, assets, approved monitor connectors, SLA clock, alert routing, audit visibility.
4. **Assurance:** backup restore tests, vulnerability/patch verification, incident command, reporting, cost insight.
5. **Commercial:** customer onboarding, pricing/contract templates, subscriptions, integrated billing, service analytics.

## Compliance reference
Map governance and service security outcomes to NIST Cybersecurity Framework 2.0: Govern, Identify, Protect, Detect, Respond and Recover. Framework alignment alone is not certification or legal compliance.
Reference: https://www.nist.gov/cyberframework

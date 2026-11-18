# NATHAN AI — MIND ARCHITECTURE / WORLDWIDE ADAPTER CONTRACT

## Purpose
Build a software representation of Nathan Tabor's **named conceptual mind architecture** using independently versioned third-party capabilities, without asserting software reproduces human consciousness.

**Originals stay original.** Every imported tool is an adapter. It never supersedes a named Nathan AI module, original document, or source claim.

## Conceptual mind map
- **MIND**: Supra (exploration), Con (reasoned coordination), Sub (foundational retrieval). Distinct from any clinical/neuroscientific assertion.
- **SOUL**: user-defined values and operating commitments, expressed as configurable, reviewable policies.
- **SPIRIT**: creative intent, narrative, games, publishing and exploration.
- **SHADOW**: adversarial self-review, contradiction logs, counterexamples, failure analysis.
- **ESSENCE**: original names, author attribution, original sources, versioned provenance.
- **CORE**: deterministic rules, access control, job state, tests and execution receipts.

## Arithmetic operations
- 1+1=2 / BUILD: create new versioned artifacts, never overwrite sources.
- 1-1=0 / CLEAR: remove a derived artifact from active use by quarantine/tombstone; **never delete immutable originals without separately authorized retention action**.
- 1x1=1 / INTEGRATE: attach a verified adapter to an existing role.
- 1/1=1 / VERIFY: record test evidence, source hash, reviewer, and result.
No numeric rule can determine truth, innocence, or deception without supporting evidence and due process.

## Three tiers
1. **HIVE**: user-facing intake, previews, approved deployments. Cloudflare Workers, Agents SDK, durable coordination.
2. **ANT HILL**: bounded coding, search, tests and repair. Isolated worktrees/containers, Codex/OpenHands/Aider/Cline adapters.
3. **CATACOMBS**: immutable source snapshots, provenance, searchable SQLite/D1 metadata, R2 backups and offline export. Hashes detect changes; backups and tested restoration provide durability.

## Original worker identity contract
Each role has:
- immutable `original_role_id`, `original_name`, `source_record_id`, `codex_version`
- `tier`, `family`, `capabilities`, `input_schema`, `output_schema`
- `approved_adapters[]`, `permissions[]`, `budget`, `timeout`, `retry_limit`
- `receipts[]`, `verification_status`, `last_heartbeat`, `operator_approval`

A *logical worker* is a registry identity, not proof of a live process. The 163-family, 1,332-unit, 1,382-node, 732m SUPERNODES and 50,000-bee models remain separately versioned specifications.

## Import / infrastructure assessment
Evaluate each candidate along:
- license and provenance; signed/pinned upstream release
- execution target (Workers, Durable Objects, container, desktop, local GPU)
- storage model (SQLite, D1, R2, filesystem, external DB)
- tool protocol (MCP, HTTP, CLI, SDK)
- autonomy and human-approval requirements
- secret exposure, egress controls, tenant isolation, prompt-injection defenses
- testability, observability, rollback, recovery, resource cost
- maintenance health and compatibility with original modules

## Recommended integration patterns
- **Cloudflare Agents**: per-task durable state, real-time communication, lifecycle; not a replacement for every framework.
- **Cloudflare Workflows**: retryable long-running multi-step jobs and approval checkpoints.
- **D1**: searchable catalog, metadata, receipts and cross-job relations; avoid using it as the sole source of truth for per-agent concurrency.
- **Durable Objects**: per-agent coordination, atomic state transitions and alarms.
- **R2**: immutable/versioned source blobs and exports, with independent backup.
- **OpenHands / Codex / Aider / Cline**: coding executors behind a single bounded job contract.
- **Paperclip / LangGraph / CrewAI / AgentScope / Qwen-Agent**: alternative planner/coordinator adapters; select per job rather than running all at once.
- **Haystack / RAGFlow / Scrivener MCP**: retrieval and creative archive adapters; no unsupervised rewriting of original texts.
- **AI Town / CAMEL / OASIS**: sandbox world and social simulation engines.
- **P2P mesh candidates**: authorized, opt-in offline synchronization only; no stealth/evasion defaults.

## One-command workflow
`REQUEST -> CERO(boundaries) -> UNO(blueprint) -> DOS(plan) -> ADAPTER SELECT -> ANT HILL BUILD -> THINKER TEST -> CATACOMBS RECEIPT -> PREVIEW -> APPROVED HIVE DEPLOY -> MONITOR/ROLLBACK`

The first prompt may grant bounded standing authorization for specific actions, resources, costs and target environments; production credential grants, public release and destructive operations require appropriate explicit permissions.

## Next implementation milestones
1. Machine-readable `original_roles.json` and `adapters.json` linked by IDs.
2. SQLite schema for source, role, adapter, job, receipt, approval, artifact and audit trail.
3. Deterministic adapter selector with capability, policy and cost filters.
4. Durable queue with idempotency, lease expiry and failure recovery.
5. Local simulation tests, then staging Cloudflare Worker with opt-in execution.
6. CI matrix for all supported adapters, with external sources pinned and reviewed.

## Status
Architecture specification only. This document does not import, install, activate, or deploy third-party agent code.

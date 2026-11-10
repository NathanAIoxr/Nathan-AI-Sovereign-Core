# NATHAN AI 🚀 — CONSCIOUNESS / Free Will Core v1

**Author's exact name:** \`consciouness\`. This spelling is preserved for the new folder, namespace and UI.

## Added to the existing ecosystem (no overwrite)
This module is a **new local browser layer** beside Nathan AI's Node Runtime, Complete Mind, and ONE. It is not a replacement for the original code, manuscripts, 0/1 systems, or \`CODEX.md\`.

The existing Node Runtime identifies **732,000,000 logical addresses**. They are not 732 million running AI instances. The shared functional policy is available to every valid node ID; a node's working state is allocated only when its ID is selected. Up to 32 selected nodes can be loaded at once. The owner can clear all working state without changing original source.

### Functional "human → digital" mapping

| Human-associated function | Implemented digital analogue | Testable result |
|---|---|---|
| Perception | Owner-provided signal intake | Bounded local observation record |
| Attention | Current focus string | Inspectable selected input |
| Working memory | 16-entry ring buffer per node | Repeatable retention/eviction |
| Self-model | Node identity, limits, focus, capability list, activity audit | Inspectable JSON snapshot |
| Decision-making | Rank 1–8 alternatives with integer priorities | Deterministic proposal and rationale |
| Free will | Explicit owner choice, override and veto | No external execution; owner-selected state |
| Conscience / accountability | Source labels, audit trail, operation restrictions | Inspectable record, error tests |
| Forget / clear | Delete temporary node state | Empty active registry after confirmed clear |

This is a **functional software model**, not a proven transfer of a living person's mind, subjective consciousness, identity, or metaphysical free will. No biological sensor or human neural recording exists in this module. The original design concept is preserved without making an unverified scientific claim.

### Creator mappings — parallel, never overwritten

- \`0 = 1-1 (create/build) and 2 = 1+1 (destory/burn) = IMAGINATION/INTUITION\`
- \`1+1 = 2 (build/create) and 1-1 = 0 (burn/destroy) = CREATIVITY\ DISCERNMENT\`
- \`node = mind = node\`; \`mind = node = mind\`
- \`Yes is Yes — No is No\`

These are **creator-authored symbolic mappings**; the ordinary integer arithmetic remains true in both directions. The two labeled directions remain independent.

## Actual integration

1. Open [the CONSCIOUNESS workshop](./index.html) from Nathan AI main hub.
2. Select any valid address in the original 732-million-node space.
3. Observe a locally entered signal, inspect the self-model, and rank candidate choices.
4. Approve any available candidate or veto the proposal; nothing is automatically executed.
5. Select a 1–32 node batch to apply the same shared policy through the **existing Node Runtime's address generator**. This connects the address namespaces, not its worker execution.
6. Export a voluntary JSON snapshot, or clear ephemeral state.

The existing SHA-256 worker runtime is unchanged and can still be started only through its original page. Future real model-provider adapters must explicitly enforce permission scopes, user approvals, and source attribution.

## API

\`\`\`js
const collective = NathanConsciouness.createCollective();
collective.observe('1', 'Check the evidence', 'owner');
const snapshot = collective.propose('1', [
  { id: 'research', label: 'Read source documents', priority: 9 },
  { id: 'pause', label: 'Pause work', priority: 3 }
]);
collective.approve('1', 'research'); // records approval; never runs a tool
collective.inspect('1');
collective.exportSnapshot(); // owner can save explicitly
collective.clear('1');
\`\`\`

Node.js usage: \`require('./engine.js')\`. Browser globals: \`window.NathanConsciouness\` and, when linked through the app, \`window.NathanNodeRuntime\`.

## Privacy, controls, boundaries

- In-memory per-page state only; no silent persistence, network calls, background processing, model-provider access, payments, biometric collection or private key handling.
- The proposed choice *cannot* execute arbitrary code or external actions. Owner approval only records a decision; future integrations need independent permission checks.
- Nothing is ever quietly installed into external hosted agents or unrelated products. The present scope is the shared address-policy module and explicitly linked Nathan AI local interface.
- Up to 16 observations and 32 audit events per selected node. Node selection is bounded to 32 concurrently active records.
- The term \`consciouness\` is the user's authored module name; scientific terms such as self-modeling and functional awareness retain their distinct evidence thresholds.

Run from repository root:

\`\`\`sh
node --test app-factory/nathan-ai/consciouness/engine.test.cjs
\`\`\`

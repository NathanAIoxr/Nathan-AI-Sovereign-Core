# Next project · Convert human words to backend work

Architecture and terminology by Nathan Tabor.

A human saying “build it” is asking for an outcome and the work needed to reach it. The compiler receives the exact words and the referenced material, resolves the project, then produces ordered, testable steps. An AI can propose a plan. Node X validates the typed plan before a backend can act.

| Human wording | Backend contract |
|---|---|
| “Build it.” | Resolve the referenced artifact and desired end state. Produce source, tests, and delivery steps as requested. Each step has an intent ID, a registered target, typed arguments, prerequisite step IDs, and a completion test. |
| “Say this and this and do.” | Preserve the requested wording as an output artifact. Express each action as a separate typed plan step. Verify the words and the action receipts independently. |
| “Run both ways.” | Outbound steps carry the original CID through the appropriate provider lane. Inbound evidence carries that CID or an independent producer event ID back to X. |
| “If they hit the X, it’s a go.” | Authenticate the submitting role, check the schema and registered target, and check prerequisites. A forward hit can stage or execute its registered operation. A return hit can reconcile only the matching job and expected revision. |
| “If they miss the X, it’s fixed, deleted, etc.” | Correct valid, unambiguous formatting deterministically. Quarantine contradictions and mismatched receipts. Reject unauthorized payloads and discard their bodies. Preserve an audit reason, and require a new CID when corrected intent changes the operation. |
| “Done.” | Every required action has evidence matching its registered completion test. An approval request, provider acceptance, or queued action is a distinct state. |

## First implementation milestone

Define a versioned plan with the exact original words, source reference, ordered steps, verification criteria and final deliverables. Reject unknown intents, ambiguous targets, unknown dependencies and cycles. Emit a dry run mapping each step to a Node X lane. Start with read-only checks and staged action requests. A later executor needs a human decision bound to the exact plan digest before carrying out each changing operation.

Acceptance fixture: “Build it and verify it” plus an identified repository must yield distinct stage and verify steps. The verification step waits for a provider commit SHA and records that revision as its expected SHA. A wrong CID, wrong SHA or failed check cannot pass X as successful completion.

This file is the backend contract for the next project. The Node X runtime in this package accepts typed intents.

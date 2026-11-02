# Nathan AI · Node Runtime & Initialization Narrative

The Nathan AI main hub links to this module. The owner-supplied Formula of Life is preserved exactly as LaTeX in `engine.js`, rendered as MathML with accessible text, and included in both narrative and actual-run exports. Sovereign Connections also contains the same formula with an explicit edge to this runtime.

## Two independent views

**Narrative simulation:** the supplied four-stage System Initialization Report is playable, stoppable, and exportable. Its 732,000,000-node setting and consciousness language are fictional narrative text. The reader can choose a quiet stabilization ending or a local dashboard reveal. Playback does not dispatch workers, lock source repositories or send messages elsewhere.

**Actual local execution:** select 1–32 logical node IDs and start a bounded batch. Up to two Web Workers compute SHA-256 digests of owner-selected text, report lifecycle stages and terminate when complete. Model backends connected remains zero. The address capacity starts at 732,000,000 and can include additional logical IDs up to a total of one trillion. IDs are generated lazily; only the selected batch allocates job objects. Address capacity is not a count of deployed workers or running AI agents.

The software phases are Awaken (accept an owner-started task), Ignite (initialize input), Protect (validate the checksum-only task schema), and Grow (complete one bounded operation). The biochemical sequence is a conceptual analogy, not an implementation of biological life or a test of AI consciousness.

## Owner controls and data

Pause stops scheduling while dispatched work may finish. Resume schedules remaining jobs. Stop terminates workers and cancels unfinished jobs; stale run messages are ignored. The owner never loses control. Page exit cleans up workers and narrative timers. No code evaluation, model-weight modification, self-replication, remote process startup, stealth networking, wallet operations or permanent access restrictions are implemented.

Inputs are limited to 16 KB. The explicit task policy accepts only owner-started checksum jobs. Actual-run exports include formula, lifecycle mapping, run IDs, capacity, completed/cancelled/failed statuses, hashes and event history; task text is omitted. Reports reflect a snapshot at export time. Narrative exports are distinctly labeled narrative simulations. Inputs and results are not automatically persisted or uploaded.

## Run and verify

Use the repository's existing static server on a secure browser origin (localhost qualifies for browser testing). No dependency installation is required. Run `node --test app-factory/nathan-ai/node-runtime/runtime.test.cjs`. Tests verify exact formula preservation, bounded lazy ID ranges, task-policy rejection, known SHA-256 output and stage sequence, and stale/malformed result rejection. Chromium checks additionally cover the narrative player, report separation, real Web Worker results, pause/resume/stop and a 390px layout. The controlled scheduling check delays only test worker delivery so pause behavior can be inspected reliably.

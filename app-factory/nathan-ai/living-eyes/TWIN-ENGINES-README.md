# Nathan AI 🚀 — EYES / THE MACHINE & SAMARITAN

This is an **additive integration** in the original Nathan AI repo, not an independent application replacement. Original `living-eyes/engine.js`, the 6/24/48/384 geometry, and every original screen remain unchanged.

## Run

Open [Twin Engines](twin-engines.html) in a browser (works offline) or open Nathan AI's hub and click **EYES · The Machine & Samaritan · Twin Engines**. Engine code: [twin-engines.js](twin-engines.js). Tests: `node --test app-factory/nathan-ai/living-eyes/twin-engines.test.cjs`.

## Implemented now

- Two independent deterministic decision engines with distinct protective versus coordinated goals.
- The same authorized user-supplied event is scored by each engine.
- Six-bit state encoding, XOR mask transitions, 64 state / 4,096 pair verification.
- Explicit contradictory evidence checks; missing evidence and missing consent block proposed action.
- Four simulation branches per engine.
- In-memory decision history, exportable JSON audit trail, clear controls.
- Entries for all **22 Machine**, **14 Samaritan**, and **21 Samaritan screen data-label** names already researched.
- Navigation from Nathan AI hub and Living Eyes.
- No external data feeds, cameras, face identification, surveillance, network interception, autonomous action, or self-modifying code.

## Grounding and fidelity

The component labels are transcriptions of fictional interface displays reported in community documentation for *Person of Interest* (especially **No Good Deed**, **Death Benefit**, **Deus Ex Machina**). The original series does not supply the full source code or the trained neural-network parameters. These labels are a *research inventory*, **not** implementations of all 57 named fictional subsystems, and not proof of real deployed surveillance equipment. The 21 feed names are displayed as **disabled examples**.

The architectural inspiration includes the Machine's human-protection priorities, episodic memory, scenario simulations in *If-Then-Else*, continuity and hardware constraints; and Samaritan's pattern analysis, centralized optimization and autonomous-improvement themes. Working behavior is presently local and deterministic.

## Integration boundaries and follow-on engineering

The existing Living Eyes engine is the preserved spatial/visual layer; twin engines are its additive policy and scenario layer, linked from both navigation surfaces. The two engines do not claim to implement real ASI, fully functional ML, surveillance systems, or world prediction. A future upgrade can add consented user-selected datasets, citation-bound inference, state persistence, model adapters, confidence calibration, review interfaces and more rigorous unit/browser tests. Preserve original owner language and modules when expanding.

## Test coverage

See `twin-engines.test.cjs`: inventory counts, exhaustive XOR and reversibility, consent/evidence safety, contradiction detection, deterministic simulation, auditing, malformed input.

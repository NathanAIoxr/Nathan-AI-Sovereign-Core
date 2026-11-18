# Nathan AI — Topological Fiber Engine (TF v0.1)

An additive module for **ONE — The Last App**, built on the conceptual stack **Tablet of Tabor**, **Tabor Vortex**, **Tabor Track Baller** and **Universal Bridge**. This deployment does not overwrite the existing `tabor-tracker-ball` Worker.

## Working in v0.1

- Twelve selectable procedural fiber paths: Nålebinding, Tatting, Tunisian Crochet, Broomstick/Hairpin Lace, Sprang, Bobbin Lace, Lucet, Kumihimo, Darning, Tambour, Stumpwork and Drop Spindle.
- Browser Canvas projector for 3D coordinates with normalized **quaternion orbit**, underside/mirror/cross-section presets, x-ray dimming and one-strand isolation.
- Dedicated bottom touchpad for single-pointer orbit and two-contact pinch-in tension / pinch-out exploded geometry / twist. The main viewport supports left/right step swipe and long-press isolation.
- Forward/reverse register, local session export, accessibility buttons and keyboard shortcuts.
- Symbolic authored crossing counts, geometry checks for finite points, explanatory capstan ratio estimate (`T_out/T_in = exp(mu * theta)`) and drafting RPM / inches-per-minute estimate.
- Optional browser SpeechRecognition commands; **this is not guaranteed offline**.
- Endpoints: `/`, `/health`, `/api/modules`.
- Cloudflare scheduled self-test at `5 * * * *` (UTC) logs the module manifest check. **It does not write code, repair deployments or build new modules by itself.**

## Verified configuration (November 18, 2026)

Cloudflare script: `nathan-topological-fiber-engine`, isolated from the other existing account scripts. Public `workers.dev` route has been **enabled**, but external HTTP smoke testing could not be completed from the connected environment. Expected URL: https://nathan-topological-fiber-engine.nathantaboract.workers.dev/ .

## Integration references

- Existing `../tabor-tracker-ball/` for `taborTrackballGesture` and `taborDigitGesture` contracts.
- Existing `../../standalone-apps/tactilecore-sdk/` for input normalization and native sensor paths, under its separate rights notice.
- Existing `../one/` for catalog inclusion when released.
- Existing `../../integrations/nathan-fabric/DEPLOYMENT-CONTRACT.md` for source → test → staged review → deploy receipts.

This v0.1 is an independent self-contained release; **it does not yet import the shared TactileCoreSDK code or integrate into ONE's navigation**, to avoid breaking existing apps. The next milestone is to extract a shared adapter with tests, link the catalog, and preserve attribution/licensing.

## Scientific and engineering scope

This is an **interactive visual prototype**, not a validated textile pattern compiler or a full Cosserat rod solver. Rendered geometric crossings are not proof of an actual knot/link invariant; every craft path is an illustrative fixture. Tension readouts are not force sensor measurements or biometric inference. The source does not use cameras or perform reliable photo-to-topology reconstruction. Unworkable patterns are **not** mathematically impossible. Near-zero network dependency is not a latency guarantee.

## Test

```sh
node --test app-factory/topological-fiber-engine/worker.test.mjs
```

Tests verify the endpoint contract and browser JavaScript parseability. They are not substitutes for real touch-device QA and textile laboratory validation.

## Remaining build queue

1. Make the shared `taborTrackballGesture`/`taborDigitGesture` adapter, verify pointer capture and ten-contact semantics, and test mouse/touch/pen on devices.
2. Implement explicit crossing graphs and over/under edge order, with auditable notation adapters for `sc/dc/UO/UOO/K2tog` rather than destructively erasing source meaning.
3. Build braid word execution and rewinding with constraint solvers and regression fixtures per craft.
4. Add material calibration, validated friction/bending/twist mechanics and optional GPU acceleration.
5. Build local-first camera-assisted segmentation as a user-reviewed editor (no promise of automatic reliable reconstruction).
6. Integrate offline voice via a supported local model, permissions and privacy controls.
7. Add CI checks and publish catalog entries to ONE and Library of Tabor with reviewed release receipts.
8. Complete external HTTP smoke testing and deployment logging; add rollbacks and reproducible build pipeline.

Do not confuse scheduled auditing with autonomous code-writing or physical compute hardware replication.

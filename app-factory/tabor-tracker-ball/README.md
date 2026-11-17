# Tabor Tracker Ball 🖲️ by Nathan Tabor

**Tech with Technology by Nathan Tabor**

Tabor Tracker Ball is a browser arcade and a reusable touchscreen controller for Tabor World. The original Tabor Track Baller event, module, and widget identifiers remain supported. The public title uses **Tabor Tracker Ball**.

## Play

Deploy or serve the release at a site root. Use touch, pen, or the primary mouse button. The game field handles a single-finger stroke or a multi-contact grip. Outside the field the browser retains normal page gestures. The Try buttons give keyboard-accessible examples. Trace replay plays the last completed stroke without applying it to the score. Scores and tuning are stored locally. The service worker caches the game shell after a successful online visit. Haptic feedback depends on browser and device support. DJ sound uses synthesized Web Audio tones and starts only after a user action.

| Game | Input and objective |
| --- | --- |
| Pinch & Flick Lab | Complete a one-digit flick, two-digit pinch release, and staggered three-point release. |
| Hurricane | Start a live clockwise or counterclockwise vortex. Alter its position, radius, and strength and clear the debris field. |
| Whirlpool | Use tight turns near floating markers, matching the required direction. |
| Swordplay | Cross the target at its displayed angle or release a hold inside the timed guard window. |
| Spin Ball | Release a straight or curved shot from the ball and sink three pockets. |
| Spellcasting | Draw two opposite lobes with a center crossover for a portal. A one-way loop creates a ward. |
| DJ Deck | Reverse the platter twice or more. Time the release to the 100 BPM beat for a score bonus. |
| Forge Bellows | Scrub to raise heat, let it decay, and release above the marked threshold. |
| Globe Explorer | Rotate a quaternion-driven globe and center four landmarks in the reticle. |
| Combination Dial | Turn a fictional dial through a three-step angle sequence. |
| Pottery Wheel | Select and sculpt three clay bands to target profiles. |
| Propeller Lift | Build lift and hold altitude inside a checkpoint band. |
| Fishing Reel | Gain progress while winding inside the tension band. High tension can slip the line. |

## Universal Digit Physics integration

- The Pinch & Flick Lab calls the original TactileCoreSDK WristFlipEngine. Its two-contact event preserves MODE_WRIST_FLIP_PINCH_2D. A three-contact grip uses the bottommost initial touch as the estimated anchor, with the original 45 ms stagger window. The browser receives contact IDs and locations.
- Hook & Ring supplies the One Euro filter, guarded 50 ms release history, 5% edge Safe-Cancel, and 16 ms hand and 20 ms toe profiles. The profile and filter are selectable. The toe option changes release timing. The nominal CSS millimeter conversion uses 96 CSS pixels per inch.
- Capture accepts up to ten simultaneous contacts. The first two contacts control pinch and twist. WristFlipEngine selects up to three contacts for its release calculation.
- Stay inside the playfield's edge band. Pinch or spread to zoom Globe Explorer or shape a pottery band. Twist to turn the dial. Spread an active Hurricane to grow it. A guarded upward flick near the Spin Ball launches it. A steady two-contact hold in Swordplay can trigger the existing timed guard.
- The enhancement attaches with attachDigitTrackBaller in public/digit-input.mjs. The taborDigitGesture event bubbles with start, move, end, or cancel stage. Live detail carries contacts, peakContacts, scale, twist in radians, estimated spanMm, and the contact's starting position. End detail adds wristFlip, guardMs, and guardedVelocity. The original taborTrackballGesture contract continues to serve one-finger, mouse, and pen interactions.
- The arcade uses touchscreen data. The original TactileCoreSDK also contains a separate HybridKinetic motion and native sensor implementation.

The build reads the shared modules from [TactileCoreSDK](../../standalone-apps/tactilecore-sdk/) and [Hook & Ring](../../standalone-apps/hook-and-ring/). The [TactileCoreSDK project-specific rights notice](../../standalone-apps/tactilecore-sdk/LICENSE.md) applies to its bundled module.

## Use it from a Tabor World game

```js
import {attachTrackBaller, normalizeOverlay} from "./track-baller.mjs";

const config = normalizeOverlay(game.controllerOverlay);
const input = attachTrackBaller(canvas, {
  onMove(stroke) { game.preview(stroke, config); },
  onEnd(stroke) { game.apply(stroke, config); },
  onCancel() { game.clearPreview(); },
});
// Use input.destroy() when leaving the scene.
```

Scope CSS touch-action: none to the play surface. Events use taborTrackballGesture and bubble from the attached surface. The original event name is retained. Event detail includes phase, gestureType, kind, position, timestamp, angle, signed net turn, signed recent RPM, dial angle, reversals, velocity, power, and the filtered path. Coordinates are centered on the surface and normalized to the shorter side. X is right and Y is down. Positive turns and RPM are clockwise. angle and dial are radians, angularVel is radians per second, and turn is revolutions. Velocity aliases velX and velY are provided. Pressure and pointer type come from the browser.

| Events | Use |
| --- | --- |
| TRACKBALL_START, TRACKBALL_MOVE | Start aim and update a live control. |
| SWIRL_ACTIVE, SWIRL_RELEASE | Scale vortex, forge effects, flight lift, or a wheel with continuous readings. |
| SLASH_RELEASE | Map swipe angle to a sword strike or use the release vector for a sports shot. |
| SHIELD_LOCK | Route a stationary hold to guard or a timed parry. |
| FIGURE_EIGHT_RELEASE, SCRUB_RELEASE | Open a portal or apply scrub reversals to a musical or mechanical action. |
| TRACKBALL_RELEASE, TRACKBALL_CANCEL | Resolve generic drags or clear an interrupted action. |

Existing BIBLeTopia chassis can use addTrackBallerToArcadeAction(action, shortSide) on their interpolated gesture actions. It retains the original action and rotation and adds trackBaller.kind, turn, direction, spin, and pathLength. The direct pointer module supplies live RPM and measured motion. Keep the Universal Bridge in the host so the host controls round charges, timing, and scoring. This standalone release publishes its own arcade and reusable adapter.

The optional controllerOverlay accepts TABOR_TRACKBALL, ballTexture, ballMassInertia, frictionDecay, hapticTickDegrees and gestureOutputMode. The public/catalog.json contains the exact mode configuration used by each built-in game. ballTexture is an asset reference a host can render. This release draws a procedural ball. Inertia, friction, and haptic ticks are applied in the included arcade; configure how the same settings affect the game host.

## Reproduce the release

Run node --test test.mjs, followed by node build.mjs from this directory. The build creates asset-bundle.mjs from public assets and verifies that the game catalog matches games.mjs. worker.mjs imports that module and serves the same content deployed to Cloudflare. The build and tests have zero package dependencies. For authorized Cloudflare API deployment, use multipart upload to PUT /accounts/{account_id}/workers/scripts/tabor-tracker-ball, with JSON metadata marking worker.mjs as the main_module and with worker.mjs and generated asset-bundle.mjs as JavaScript modules. The Health route returns the app name, release, and game count.

- Pointer Events and pointer capture https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- Coalesced pointer samples https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/getCoalescedEvents
- Vibration API https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
- Cloudflare Worker upload https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/update/

## 101 Library Cartridges

Open [101 Library Cartridges](./public/library.html) from Tracker Ball. Search the complete 101-position brief under the 21 main [Library of Congress classes](https://www.loc.gov/aba/cataloging/classification/lcco/). The catalog uses internal Tabor IDs and suggested subject labels. It retains supplied subclass codes and notes discrepancies, including QM under Q. The separate Tracker Ball draft stops during row 65. Related rows are cross-linked where the designs overlap.

Nine cartridges have short, playable exercises using the Universal Bridge's planned 45/10/45 layout. Match two records to earn one charge, then spend it on the touch surface or with the action button. The same touch adapter supplies one-finger strokes and pinch release. The exercise scores one point for one committed action. It uses addition, subtraction, and record IDs. The existing Tracker Ball controller is shared with the older arcade and retains its own underlying numerical code.

Cartridge records and characters expose attributes, characteristics, functionalities, and traits. Nathan AI, PK, and the Grape-Apple Curator have scripted roles. Exhibit and design records describe subjects for future development. Data export is local.

## Tabor Hive v.9 — Universal Tech Dominion

Open [Tabor Hive v.9](./public/hive.html) from Tracker Ball or Library Cartridges.

> Thats the above the blow is Ants 🐜 and the Ant 🐜 Farm - nasa uses the pattern - so do I -I used the normal pattern but then I also reverse the pattern. Also turn the pattern up so it runs vertical not just linear and then I spin it left or right at the same time spinning it right to left so it’s going both ways at the same time so you can’t see it - but it’s there -

**Above** places intent and approval with the Nathan AI Hive. The Database Bee swarm has its ten previous roles plus eleven technology domains. The Universal Interaction + Control Surface links the existing Tracker Ball and the 101 Library Cartridges. The Personal Knowledge Vault is the designated long-term personal memory store in the design. Its write path requires explicit approval. Shadow Bee owns internal audit design. A temporary specialist request goes through Replication Bee and ends with its assigned task.

**Below** places Ants and the Ant Farm under the interaction surface. Normal and reverse walk the same trail in opposite directions. The vertical setting changes the trail coordinates and keeps the counters. Left and right orbit concurrently. Separate lanes render their individual positions. The combined reading uses the sum of their signed steps. Equal steps from a reset keep the net at zero while each lane accumulates steps.

The sample handoff has a domain, an action, a priority, a decision, a result, and an optional specialist lifecycle. It reads a fictional inventory entry inside the browser. The v.9 Hive Bus encryption, device registration, vault permission service, and production hardware integrations are architecture. The demo uses neither connected device operations nor actual worker provisioning.

Related Tabor work includes the [Living Eyes concurrent CW/CCW tests](../nathan-ai/living-eyes/engine.test.cjs) and the [Five Matrix Print Shop](../nathan-ai/3d-print-shop/). NASA documents ant-inspired central-place foraging in [Swarmies](https://ntrs.nasa.gov/citations/20150016084) and division of labor in its [ANTS archive](https://science.gsfc.nasa.gov/attic/ants/faqs.html). Those records establish the ant-swarm precedent. Nathan's vertical and counter-rotating pattern is recorded here as his own extension.

## Tabor Hive v.10 — worker population

The shared fleet manifest configures **126,000,000,000 worker addresses** across **2,520,000 hives**, with **50,000 worker slots per hive**. The 10 existing and 11 technical Bee roles are job assignments. Each hive and slot pair identifies its own worker. The address range starts at **H0000001-B00001** and ends at **H2520000-B50000**. Use the population form to route a sample handoff to any address in that range. Changing the selected role leaves the worker address as the sample's identity.

The Python runtime materializes addressed records on demand. It reads the same fleet manifest and the 101-cartridge catalog. Its local dispatch uses a prioritized queue, and the Ant Farm reports forward, reverse, vertical, left, and right readings. The sample vault starts closed to writes. The coordinator can issue one-use approval for a specific record. The sample runtime reports configured population and represented local worker records separately. Its loopback WebSocket streams read-only display state and uses zero external API tokens.

From this directory:

```text
python3 tabor_hive_v10/main.py --hive 2520000 --worker 50000 --cartridge 101
python3 tabor_hive_v10/main.py --serve 8765
node --test test.mjs library.test.mjs hive.test.mjs
python3 -m unittest discover -s tabor_hive_v10 -v
```

For the live local view, open http://127.0.0.1:8765/. The browser workbench is a separate surface that uses the shared population manifest. The scope of this runtime is local execution. Distributed provisioning and a fleet-wide count of live instances require deployed infrastructure.

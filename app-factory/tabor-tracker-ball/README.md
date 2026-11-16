# Tabor Tracker Ball 🖲️ by Nathan Tabor

**Tech with Technology by Nathan Tabor**

Tabor Tracker Ball is a browser arcade and a reusable touchscreen controller for Tabor World. The original Tabor Track Baller event, module, and widget identifiers remain supported. The public title uses **Tabor Tracker Ball**.

## Play

Deploy or serve the release at a site root. Use touch, pen, or the primary mouse button. The game field owns one active stroke at a time. Outside the field the browser retains normal page gestures. The Try buttons give keyboard-accessible examples. Trace replay plays the last completed stroke without applying it to the score. Scores and tuning are stored locally. The service worker caches the game shell after a successful online visit. Haptic feedback depends on browser and device support. DJ sound uses synthesized Web Audio tones and starts only after a user action.

| Game | Input and objective |
| --- | --- |
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

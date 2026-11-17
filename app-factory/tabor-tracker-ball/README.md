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

## Tabor Track Baller v6 · 101 Applications

Open `loc101.html` from the **101 Applications** link in the arcade. Nathan Tabor's
numbered brief supplies module order. Its 101 modules cover all 21 main classes
in the [Library of Congress Classification Outline](https://www.loc.gov/aba/cataloging/classification/lcco/),
with E and F available as individual filters.

- The searchable catalog stores each module's class, brief, input profile, task,
  and sample data. Search matches the original brief titles for adapted entries.
  A module opens directly at `loc101.html?module=63`, for example.
- Scenes use eight shared interactive profiles. These cover quaternion orbit,
  a precision dial, ordered gesture paths, an illustrative contact field, animated
  flow, Web Audio, a node network, and a Boolean logic table. The samples are
  schematic activities. Some titles describe the intended larger application.
- The controller reuses one-finger gesture analysis and the existing multi-contact
  gesture implementation. Buttons and the keyboard offer alternatives. The field
  visualizes contacts that the browser exposes. Tilt and sound require explicit
  interaction and depend on browser and hardware support.
- Module 5 shows three KJV verses. The app uses sample records and simulated
  data elsewhere. The medical entries are educational demonstrations. Weapon-
  related entries use exhibition, sporting, and classroom analogs.
- Completion is browser-local. **Clear scene** resets the current interaction and
  retains the completion history. The service worker caches the catalog and
  application shell on the first successful connected visit.

Run `node --test test.mjs loc101.test.mjs` and `node build.mjs` to validate and
package the release. The Worker health endpoint reports both arcade and
application counts.

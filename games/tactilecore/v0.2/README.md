# TACTILE//CORE — Universal Tactile Finger-Physics Platform

**Private development demonstrator v0.2 · 2026-11-12**

This deliverable translates the supplied 101-game platform concept into a browser-runnable **TypeScript starter** with a reusable input SDK and six arcade cartridges. It preserves the source taxonomy, but it is **not yet** a full 3D mobile game, native iOS/Android build, Rapier physics integration, multiplayer tournament service, or patent application.

## Run it

The `dist/` folder contains compiled JavaScript, so Node/npm dependencies are **not needed just to play**.

From this folder, run one of the following (on a computer with Python or another local static server):

```sh
python3 -m http.server 8080
# Then open http://localhost:8080/
```

For development, use TypeScript 5.7+ and run:

```sh
npm install
npm run build
npm test
```

Opening `index.html` directly via `file://` is not guaranteed to work because the browser may block JavaScript module imports. On mobile, serve the folder from a trusted local or HTTPS server, then open the page in a touch-capable browser. This package is **not deployed online**.

## Included playable arcade cartridges

| Cartridge | SDK mode | Demonstrates |
| --- | --- | --- |
| Cornhole | `MODE_PICKUP_FLING` **or** `MODE_THREE_FINGER_WRIST_FLIP` | Both choices remain: classic swipe or thumb-under/two-above Wrist Flip; slick/stick preserved |
| Wrist-Flip Bowling | `MODE_THREE_FINGER_WRIST_FLIP` | Ten-pin rack practice, adjustable shot hook, strike/spare recognition, simplified knockdown |
| Hook & Ring | `MODE_PINCH_PULL` | Draw/release gesture, ring/hook target |
| Ringer Marbles | `MODE_THUMB_FLICK` | Impulse and simplified marble collisions |
| Virtual Target Archery | `MODE_PINCH_PULL` | Non-realistic target scoring |
| Jenga Balance | `MODE_DUAL_GRIP_TWIST` | Two-finger twist detection, arcade stability scoring |

The original source proposed four cartridges that only covered **three distinct gesture modes**. This starter adds Jenga Balance as a fifth cartridge to cover all four modes.

## Shared TactileCoreSDK

- `src/core.ts`: four original gesture modes plus a three-finger wrist-flip variation; deterministic hash-seeded environment; 1-Euro low-pass filter; 50ms time-stamped touch buffer; angle estimation from a sample window ending 16ms before touch release; local profile persistence; calibration correction; multi-pointer twist tracking.
- `src/games.ts`: Cornhole dual-control logic, ten-pin Bowling arcade rack, cartridge metadata, `initScene`, `reset`, `onInputUpdate`, `onRelease`, `evaluateTurnState`, arcade visualizations, and scoring.
- `src/main.ts`: Cornhole control selection (persisted locally), optional wrist-rate motion sampling, game launcher, touch and pointer wiring, desktop/multitouch handling, profile controls, seed controls, telemetry receipts, screen-edge cancel and environment cues.
- `catalog_101.json`: all 101 titles **verbatim** from the provided source, with control categories and concept/prototype statuses; Bowling (#74) now links to its prototype cartridge. A catalog entry is not an implemented game.
- `original_user_source.txt`: unchanged user-provided source text.
- `tests/core.test.mjs`: 13 automated core and cartridge tests, including three-finger grip validation and both Cornhole modes.

## Device calibration caveats

1. Pointer events provide **CSS pixel** coordinates; `devicePixelRatio` is not the same as physical screen PPI. Initial `96/25.4 CSS px/mm` is only an estimate.
2. A **card-edge measurement** control is provided. Compare the displayed bar with the short edge (53.98mm) of a standard bank card; the ratio is saved locally. Changing browser zoom or scaling can affect calibration. For shipping production builds, use platform device metadata or per-device measured calibration.
3. The 1-Euro filter uses a speed-adaptive cutoff. It reduces, but does **not eliminate**, input latency and micro-jitter.
4. The ring buffer estimates pre-lift direction from available points; real touch event timestamps, sampling rates, and coalescing must be tested on devices.
5. "Learn straight-up grip" collects four intentional calibration gestures and estimates angular bias. It does not infer intent from ordinary deliberate curved throws. Local average pull depth updates with scored throws.
6. Sensor input requires explicit user permission and often HTTPS on supported devices. In v0.2, optional **rotation-rate samples** can contribute to Wrist Flip power and hook. Gyroscope feedback is not an accurate measure of finger placement or physical grip force. Full 3D gyro-aiming remains future work.
7. **Three-finger wrist-flip grip**: three simultaneous on-screen contacts are required. One contact must be visibly *below* the other two, which must be laterally separated. The SDK treats them as thumb + index/middle **positions**; capacitive screens cannot identify fingers anatomically or measure grip pressure. Release any of the three after a forward flick. It operates with upward three-finger touch movement alone; sensor input is optional.
8. **Both Cornhole input choices stay**. The UI toggles Classic Swipe / Fling vs Thumb + Two-Finger Wrist Flip without resetting the score or the slick/stick bag selection. The choice is stored locally. Bowling starts directly in Wrist Flip mode. A touch-only or short-range sensor-only flick can be used when conditions permit; tests cannot establish ergonomics on an actual phone.

## Environment and fairness

- `matchSeed + cartridge ID + round number` produce deterministic wind/glare/bird cue values.
- The UI displays a 1.5-second cue period before any release is eligible.
- This is **not authoritative multiplayer synchronization**. Rendering and simplified physics vary with local frame timing; deterministic multiplayer requires fixed timestep, stable collision order, and authoritative/replayable simulation.
- The UI uses locally stored score and turn counts for practice. Official 10-pin bowling scoring, Cornhole cancellation scoring to 21, tournament clocks, 365-day leagues, real currency, bots, real-money purchases, and leaderboard services are not implemented.

## Next engineering milestones

1. Test wrist-flip thumb/finger ergonomics and actual device-motion sensor coordinate frames on multiple iOS and Android phones; calibrate gesture validity and false releases. Then extract the SDK into a production-independent package with native iOS/Android pointer adapters, sampling tests, device calibration fixtures, and calibrated field trials.
2. Replace 2D Canvas arcade illustrations with a 3D renderer and deterministic physics integration (e.g. Three.js + Rapier), soft-fill Cornhole bag simulation, and CCD for rapidly moving virtual objects.
3. Add authoritative scored game rules, fixed-step simulation at an empirically justified rate, replay verification, and turn logs.
4. Add optional user authentication, privacy controls, and tournament service; validate against abuse, clock drift, disconnects, and score manipulation.
5. Review the proposed invention privately with a registered patent practitioner and perform a documented prior-art search before public disclosure.

## IP notice

This project is an **unpublished development draft** created from the supplied source. No patent filing was made and this package makes no representation that any invention is novel, patented or currently patent pending. Review `IP_TECHNICAL_DISCLOSURE.md` for candidate technical disclosures and unresolved claim questions.
# HybridKineticEngine — Revision 0.2

**Design / IP attribution (as supplied):** Nathan Tabor — November 12, 2026. The user designates TactileCoreSDK and its named game mechanics as proprietary and refers to the wider platform as patent pending. No application filing, patent grant, or legal novelty is independently verified. No third-party open-source code is included in these generated Swift/JS implementations.

## Source-grounded scope

This revision is based on `USER_SUPPLIED_HYBRID_SPEC_2026-11-12.txt`, preserved **verbatim**, including the author's reference code, original labels, and aspirational descriptions. It specifies two input sources under one `UnifiedThrowVector`:

1. Glass-touch 1/2/3-contact grip, with bottom anchor and staggered lift-off, 14ms (hand) / 20ms (foot) guard defaults.
2. Handheld CoreMotion IMU input: a virtual baseball pitch event and projected rotational gesture recognition: circle, triangle, figure-eight, swish/flick.

Five native SwiftUI/SceneKit cartridges: Baseball Pitching, Bowling, Cornhole, Pub Darts, Air Conductor. Cartridge numbers explicitly retained: Cornhole 02, Bowling 08, Darts 09. No new canonical numbers invented for Baseball or Conductor.

## Source repairs / what is different from the pasted draft

The supplied Swift snippet is **not ready to compile as pasted**. Among the defects corrected in the new implementation:

- Generic Swift `Set`, `SIMD2`, and tuple indexing were missing or malformed (e.g. `sortedTouches.0` instead of indexing an array's elements); so were `validSamples` fallback expressions and the two-finger vector extraction (`let v1 = fingerVelocities` rather than an indexed vector).
- The original contact erasure could discard samples needed to compute the final release vector. Here all completed trails persist until a throw finishes; batch processing respects the arbitrary iteration order of a Swift `Set<UITouch>`.
- Touch identity is inferred from position, not guaranteed physical finger identity. UIKit touch positions are points, **not millimeters**. An optional calibrated points/mm value makes mm/s available only after calibration.
- Native touch timestamps come from `UITouch.timestamp` (seconds since boot) multiplied by 1000, instead of a new clock reading per event.
- Non-anchor-first releases are rejected for the multi-contact staggered grip; one-contact swipe remains supported.
- Motion arrival is delivered to the main actor; the user must **hold an on-screen ARM/TRACE control** for active motion capture. The virtual pitch disarms after a release and has a cooldown. Never toss a device in the air.
- True ball speed, axial projectile RPM, body position in 3D, and true finger pressure are **not measured** by these algorithms. IMU motion is acceleration/rotation of the device; integrating gyro rate to 2D is **rotational projection**, not accurate displacement through a room.
- The shape recognizer is a simplistic *heuristic*; the JavaScript test suite uses synthetic trajectories. Real-world gestures must be collected and classifier performance measured across devices and users.
- SceneKit is deprecated by Apple as of WWDC25. It is retained here only to honor the requested 3D prototype; select RealityKit for a maintained commercial platform.

## Contents

- `native/ios/hybrid/TactileCoreSDK.swift` — type-safe UIKit + CoreMotion unified input engine.
- `native/ios/hybrid/UniversalPhysicsArenaView.swift` — SwiftUI `UIViewRepresentable` SceneKit arena for five cartridges. Illustrative projectile visuals, not production dynamics.
- `native/ios/hybrid/HybridKineticDemoApp.swift` — example `@main` application entrypoint **for a new project only**.
- `src/kinetic.mjs` — standalone browser kinetic gesture input adapter.
- `src/app.mjs` — wired five-cartridge browser prototype, opt-in motion, hold-to-arm, touch drawing fallback.
- `tests/kinetic.test.mjs` — inertial and synthetic shape-classification automated tests.
- `docs/hybrid-mobile-preview.png` — screenshot from headless Chromium.
- `standalone.html` — complete no-runtime-dependency offline browser demo.

## Running

**Web:** Open standalone HTML directly in a browser for touch demos and simulated air inputs. For actual browser motion sensors, host `index.html` / its package on **HTTPS or localhost**, click `ENABLE DEVICE MOTION`, approve permission if prompted, switch to Baseball/Air Patterns, **hold** the control and keep the device secure. Sensor support, accuracy, and permission behavior depend on hardware, browser, and settings. A browser cannot guarantee a motion event each 10ms.

**Native:** Make a new Xcode iOS 17+ SwiftUI application, add the three `native/ios/hybrid/*.swift` files. If the project already has `@main`, omit `HybridKineticDemoApp.swift` and embed `UniversalPhysicsArenaView()` in your existing entry point. Add `NSMotionUsageDescription` / Privacy - Motion Usage Description: `Motion input controls virtual in-game pitches and gestures while the device remains in your hand.` Run on a physical iPhone/iPad to verify motion; Simulator results are not sensor-hardware validation.

Native `.swift` files have been checked using `swiftc -frontend -parse` on Linux, which checks only syntax; compiling/linking UIKit, CoreMotion, SwiftUI, and SceneKit or testing on an Apple device is **not possible in this container**. Treat this as source for Xcode integration, not as an already shipped `.ipa`.

**Tests:** `npm test`. JavaScript unit tests cover touch, synthetic shapes, hold-to-arm, cooldown, and input capture. A browser smoke test rendered a mobile layout, played bowling and virtual baseball, and showed a figure-eight result without JS errors. This is not a test of physical sensor readings.

## Relevant official docs checked

- Apple CMDeviceMotion — https://developer.apple.com/documentation/coremotion/cmdevicemotion
- Apple UIKit UITouch — https://developer.apple.com/documentation/uikit/uitouch
- Apple UITouch.timestamp — https://developer.apple.com/documentation/uikit/uitouch/timestamp
- Apple SceneKit deprecation / move to RealityKit — https://developer.apple.com/documentation/realitykit/bringing-your-scenekit-projects-to-realitykit
- MDN `DeviceMotionEvent.rotationRate` (deg/s) — https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/rotationRate
- MDN `DeviceMotionEvent.acceleration` (m/s²) — https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/acceleration

## Outstanding validation

- Xcode native compilation, entitlements/privacy descriptions, compatibility across current iOS releases.
- Per-device touch-position mm calibration, input latency, gesture false positives, CPU/battery draw, real-user ergonomics.
- Physically plausible game dynamics (ball lane friction, pin collision, bag surface contact, darts flight).
- Patentability requires qualified independent prior-art review; file checksums only record integrity, not inventorship or patent filing.

**Privacy:** All browser and native examples process input locally. No networking, analytics, ads, credential access, or external runtime libraries were added.

# TactileCoreSDK · Active Code-Backed Development · v0.2.1

**Project status:** Active software development with source code supplied by Nathan Tabor and an executable browser implementation. Not merely an idea or proposal. The original user-supplied Swift specification and code are preserved in `docs/USER_SUPPLIED_HYBRID_SPEC_2026-11-12.txt`; implementation repairs and extensions are separate. Browser tests passed; native iOS framework compilation and physical device verification are pending.

**Design attribution:** Nathan Tabor · November 12, 2026. The user identifies the platform, TactileCoreSDK, game mechanisms, names and narrative specification as their intellectual property and describes it as "patent pending." This README does **not** assert a filing has been confirmed or that patent rights have been granted. The original code in this prototype was authored for this deliverable and is not represented as a reproduction of a third-party engine.

## What was actually built

- A browser-based game demonstration for cartridge `ten_pin_bowling` (08), `beanbag_toss` (02), and `pub_darts` (09).
- Shared `WristFlipEngine` supports **one**, **two**, and **three** concurrent touch contacts, stable pointer IDs, adjustable device dimensions, stable bottom anchor, event cancellation, optional motion sensor fusion, and a 14 ms lift-off guard using a historical 50 ms measurement window.
- Browser Pointer Events input, handling coalesced events where supported, plus opt-in DeviceMotion access where available.
- Local-only processing, scorekeeping, demonstrative arcade outcomes, and a demo-throw button for desktop devices.
- Automated Node tests for grip modes, lift-off noise rejection, cancellation, bounded game results, and non-permission motion behavior.
- No remote storage, tracking, advertising, or third-party runtime dependencies.

## Run

In the project folder run:

```bash
npm test
python3 -m http.server 8080
```

Open `http://localhost:8080/` on a computer. For **physical motion** access on a phone, host the project on **HTTPS** and open the page there, then tap `ENABLE DEVICE MOTION`. Touch-only gameplay works without motion permission. Do **not** throw your phone.

## Key physical/hardware distinctions

1. HTML and iOS screen coordinates increase **downward**; a bottommost touch is **maximum Y**, not minimum Y. A point cannot be conclusively identified as a thumb just from its coordinates. Treat the geometry as a mode-specific, optionally user-configurable role estimate.
2. Touch position itself does not measure the physical angular rate of a wrist. When device motion is permitted, rate-of-rotation may contribute to the release estimate; without it, the code uses **virtual flick velocity** derived from screen touches. DeviceMotion access depends on hardware/browser/permissions.
3. CSS pixels are **not physical millimeters**. Precision mm/mm-per-second units require per-device calibration or native sensor metadata. This demo uses CSS pixels per millisecond and normalizes values for game control.
4. Generic mobile screens generally do **not** report true biological finger identity and cannot guarantee independent touch pressure. Haptics, pressure, 240 Hz sampling, and motion sensors vary by device.
5. The 14 ms lift-off filter and 15–45 ms release window are *prototype choices to validate*, **not** proven optimal constants or guarantees of error-free detection.
6. A 15–45 ms post-thumb release interval can be challenging to sample at a 60 Hz touch sampling rate (~16.7ms per sample). Native coalesced touches or longer calibrated windows may be necessary.
7. The drawing and scoring functions in this first prototype are **arcade approximations**. No claims of actual ten-pin impact dynamics, beanbag material simulation, or realistic dart aerodynamics are made.
8. Physically flipping a device while maintaining three touchscreen contacts is grip- and device-dependent. This requires ergonomic trials and options such as a stable-screen, one-handed, or sensor-first mode.

## Open-source foundations checked

- W3C Pointer Events: https://www.w3.org/TR/pointerevents/
- Apple UIKit coalesced touches: https://developer.apple.com/documentation/uikit/getting-high-fidelity-input-with-coalesced-touches
- Apple Core Motion: https://developer.apple.com/documentation/coremotion/cmdevicemotion
- Android MotionEvent: https://developer.android.com/reference/android/view/MotionEvent
- DeviceMotion API: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event
- Matter.js, possible **future** rigid-body collision physics (MIT license): https://github.com/liabru/matter-js

No third-party source was copied into this prototype. These technologies demonstrate feasibility of individual parts, but do not establish that this combined mechanic is novel or patentable.

## Roadmap

1. Capture real motion traces on devices with varied touch-sampling rates; benchmark false releases and latency.
2. Add in-game calibration for dominant hand, portrait vs landscape orientation, hold angle, accessibility, and one-handed use.
3. Native UIKit `touchesBegan/Moved/Ended`, coalesced touches + CoreMotion bridge; Android `MotionEvent` pointer-index handling + SensorManager bridge.
4. Replace illustrative scoring with game-specific 2D/3D engines, lane friction/pin impact, bag soft-body/contact behavior, and dart flight model.
5. Support multiple simultaneous players, external displays, spatial controllers and expanded game cartridges.
6. Keep IP documentation private while evaluating novelty and filing strategy; user-provided "patent pending" marking is not independent proof of filing.

## Native adapter examples

- `native/ios/TactileCaptureView.swift`: UIKit multi-contact touch samples, coalesced movements, and CoreMotion source.
- `native/android/TactileCaptureView.kt`: Android MotionEvent pointer IDs/history and gyroscope source.

These are **reference adapters, not released native applications**. The platform-specific gesture classifier, lifecycle handling, device calibration, privacy/permission disclosures, accessibility and native build tests remain work items. In particular, native iOS sensor integration may require the correct app privacy keys and user disclosures.

For a broader, URL-linked targeted open-source survey, see `docs/OPEN_SOURCE_RESEARCH.md`.

## November 12, 2026 — Hybrid Kinetic 0.2 extension

Added five-cartridge web demo, deliberate handheld virtual pitch input, rotational figure gestures, and repaired Swift UIKit/CoreMotion + SwiftUI/SceneKit source. See [HYBRID_KINETIC_RELEASE_NOTES.md](HYBRID_KINETIC_RELEASE_NOTES.md) for actual functionality, limits, corrections, Xcode integration, and source references. The historical v0.1 scope above remains as documentation of the earlier milestone; don't treat the earlier three-cartridge description as the current feature inventory.

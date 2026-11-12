# Targeted open-source/code research • November 12, 2026

**Scope:** Relevant input APIs, openly documented gesture libraries, game engines, and physics components were reviewed as engineering precedents. This is **not** a search of every open-source repository, patent, app, commercial SDK or game. No legal novelty conclusion is warranted from this survey.

| Component | Repository / standard | Verified support | How it could be used |
|---|---|---|---|
| Cross-platform touch events | W3C Pointer Events • https://www.w3.org/TR/pointerevents/ | Pointer IDs, cancel, coalesced event lists | Input adapter for browser/PWA |
| Apple high-fidelity touch | https://developer.apple.com/documentation/uikit/getting-high-fidelity-input-with-coalesced-touches | Coalesced touches | iPhone/iPad native timing |
| Apple motion | https://developer.apple.com/documentation/coremotion/cmdevicemotion | Rotation, acceleration, attitude | Real device rotation-based input |
| Android pointer events | https://developer.android.com/reference/android/view/MotionEvent | Per-contact pointer IDs and event history | Android adapter |
| Browser motion | https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event | Acceleration/rotation event (device and permission dependent) | Optional motion fusion |
| Hammer.js (MIT) | https://github.com/hammerjs/hammer.js | Tap/swipe/pinch/rotate gesture recognition | Reference, but does not itself implement staggered three-point game release |
| interact.js (MIT) | https://github.com/taye/interact.js | Multi-touch, inertia, snapping | Optional higher-level gesture input |
| Phaser | https://github.com/phaserjs/phaser | Multi-pointer input (up to ten pointers) | Future polished 2D game cartridge integration |
| Matter.js (MIT) | https://github.com/liabru/matter-js | 2D rigid body physics, collisions, constraints | Bowling lane/pin collision work |
| Godot (MIT) | https://github.com/godotengine/godot | Cross-platform 2D/3D game engine | Potential alternative for final game experience |

## Engineering conclusion

All the **individual** building blocks (multitouch, contact order, tilt/rotation rate, swipe velocity, virtual physics) have precedents. The proposed **specific combination, release-timing protocol, common mapping for different physical game objects, calibration strategy and consumer experience** merits actual engineering experiments and separately qualified prior-art analysis. It is inaccurate to claim that existing apps have never used similar approaches without a much deeper independent search.

## Implementation decision

This deliverable uses original dependency-free JavaScript input/game code so the user's designated proprietary design is not blended with third-party copyrighted code. MIT libraries above were **evaluated as options** and are not bundled. The iOS and Android example adapters emit native input events without assigning biological finger identity; both require platform-specific integration and testing.

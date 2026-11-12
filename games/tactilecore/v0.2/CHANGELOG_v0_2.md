# v0.2 — Dual Cornhole controls and new Wrist-Flip Bowling

**Attribution:** Nathan Tabor — user-authored design direction, November 12, 2026.

**Exact user instruction:** "Upgrade to cornhole - both options stay We’re gonna do a new bowling. We’re just gonna make it where the thumbs on the bottom. The two are on the top and you flip your wrist like your flipping. What do you do that you know? Same thing with cornhole."

## Cornhole — both controls preserved

- **Option 1: Classic Swipe / Fling** — unchanged original single-finger touch release.
- **Option 2: Thumb + Two-Finger Wrist Flip** — hold with three on-screen contacts (one lower, two upper), move/flip upward and lift any finger. Motion sensors are opt-in; touch-only fallback works.
- Both options share the existing bag/board, slick/stick side toggle, arcade scoring and environmental cues. Switching **does not reset the current Cornhole game**.

## New Bowling cartridge

- `wrist_flip_bowling` — ten-pin arcade rack; finger/motion flick controls power, sideways motion/rotation adds simulated hook; strike/spare labels; remaining-pin state over two attempts per rack.
- Ten-pin regulation scoring and physically accurate pin dynamics are **not** implemented in this starter version.

## Platform changes

- New gesture: `MODE_THREE_FINGER_WRIST_FLIP` as a reusable *variation* of the `MODE_PICKUP_FLING` mechanic.
- Three-finger geometry check, 50ms input history, 16ms pre-lift release estimate, motion-enabled flick magnitude and signed roll, optional sensor permissions, and fallback gesture mode.
- Original four gesture categories and 101-game catalog remain; Bowling #74 is marked prototype, not a new 102nd entry.
- Six selectable demo cartridges; 13 automated tests.

**IP status:** User-identified proprietary design. This project neither verifies nor files a patent application; do not label a product patent pending without appropriate filing.
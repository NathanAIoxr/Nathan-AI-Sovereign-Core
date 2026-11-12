# Technical disclosure notes — attorney review draft

**Project:** Universal Tactile Finger-Physics Platform / TactileCoreSDK  
**Date:** 2026-11-12  
**Status:** Engineering documentation only; **not** a filed provisional or nonprovisional patent application.

## Problem identified in the supplied design

Screen-touch physics games may behave inconsistently across devices and players. The proposed system aims to mitigate screen pixel-density variation, sampling artifacts around fingertip lift-off, slow-motion jitter, intentional grip bias, and inconsistent conditions between asynchronous competitors.

## Proposed technical modules (source-derived)

1. **Physical-gesture normalization** — map touch displacement and speed into physical millimeter units using platform PPI data or an explicit measured reference. DevicePixelRatio is not sufficient to obtain physical PPI in a generic browser.
2. **Buffered release estimator** — hold a timestamped 50ms ring buffer and estimate release angle/velocity from a fitted recent segment ending 16ms before release, rather than accepting the final capacitive point.
3. **Velocity-adaptive input smoothing** — apply One-Euro filtering to touch and optional sensor streams, independently tuned for pointer and gyroscope signal characteristics.
4. **Personal calibration** — maintain user-approved, locally stored hand-angle offset, reference distance, sensitivity, and pull-depth signals; include reset and explicit calibration sessions to avoid misinterpreting tactical shots.
5. **Deterministic turn conditions** — generate turn-specific wind/glare/shadow cues from a seed so matching competitive turns can replay agreed conditions and show visible telegraphs before release.
6. **Game-cartridge abstraction** — normalize the above sensor signals into one of four standardized gesture contracts, with game-specific scoring and physics loaded independently.

## v0.2 additional candidate disclosure: thumb-under/two-above Wrist Flip

The user introduced an alternative gesture that **preserves Classic Cornhole controls** while using three contacts in a thumb-below, two-fingers-above arrangement with an upward *wrist-flipping* release. The proposed adapter is reusable for a new ten-pin Bowling cartridge. The engineering prototype detects contact geometry, tracks the group centroid, uses a pre-lift release buffer, and optionally integrates permissioned phone-rotation rate for flick magnitude and lateral spin.

The arrangement and its source attribution should be preserved in patent-review evidence; this document **does not establish uniqueness, novelty, patent ownership, or filing status**. Grip identities are inferred from positions, not measured physically. Native sensor validation, real-world experiments and prior-art searching are needed.

## Potential distinguishing combinations requiring prior-art search

- Combined pre-lift history window + physical millimeter calibration + per-user bias correction, exposed by one cartridge-independent gesture API.
- Hybrid physical and user-specific calibration that learns only in explicitly designated training sessions and can be standardized for fairness-sensitive competition.
- Reproducible seeded hazards with advance telegraph timing enforced consistently across separate asynchronous sessions.

**These are possible technical disclosures, not claims of novelty.** Core techniques such as filtering, normalization, ring buffers, game cartridges, and seeded randomness have existing prior art. Patentability depends on inventive distinctions, appropriate enablement, jurisdiction, public-disclosure dates, and a formal prior-art review.

## Reconciliation items from the source material

- Existing text uses **14ms** in one master Codex block and **16ms** in an earlier Cornhole specification. The current prototype uses **16ms** consistently; assess this as a configurable parameter in production rather than an absolute guarantee.
- Four starter cartridges cover only three input modes; a Jenga Balance prototype was added to cover mode D.
- Web browsers do not reliably reveal physical PPI; a card-edge calibration fallback was implemented.
- A shared seed does not itself guarantee simulation determinism. Timestamp ordering, timestep, integration, collisions and random-call sequence require a deterministic implementation and validation.
- The source mentions a provisional filing and use of "Patent Pending." The USPTO indicates that a provisional filing supports that designation, but there is no filing evidence in the supplied text. Do not put "patent pending" on public material unless an appropriate application has actually been filed.

## Review-ready evidence to collect

- Dated original concept notes and iteration history; authorship/inventorship records.
- Implementation flowchart, annotated source files, timing plots, buffer examples, and before/after release error measurements on multiple devices.
- Patent and product prior-art search organized by claim element and publication date.
- Device calibration and sensor error distributions, cross-device reproducibility tests, and controlled A/B latency measurements.
- Source-code and open-source license review before any commercial release.

## Public reference links

- USPTO — Provisional Application for Patent: https://www.uspto.gov/patents/basics/apply/provisional-application
- MDN — `devicePixelRatio`: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
- Casiez, Roussel & Vogel (CHI 2012) — 1€ Filter paper: https://gery.casiez.net/publications/CHI2012-casiez.pdf

No USPTO filing, external publication, or GitHub repository mutation was performed as part of this deliverable.
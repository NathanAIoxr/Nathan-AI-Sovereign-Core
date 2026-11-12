# Tabor Tags — Technical Development Status
**By Nathan Tabor | 2026-11-12**

This document separates **existing Swift source** from **integrated, tested hardware** without treating the project as merely an idea.

| Workstream | Supplied now | Still needed |
| --- | --- | --- |
| Product and system definition | Snap-on equipment tag, body-tag set, phone/tablet/TV simulator workflow | Detailed mechanical, electrical, wireless and safety specifications |
| Golf simulation | `TaborGolfRangeEngine`; club presets; shot estimate calculations; history | Input calibration, physics validation against instrumented shots, repeatability testing |
| SceneKit golf range | `PrivateGolfRangeView`, fairway, markers, ball tracer, HUD | Actual integration into iOS project; build and runtime verification |
| Multi-tag biomechanics | UUID role assignment, telemetry ingestion, peak sequencing, heuristic score and coach text | BLE transport, robust synchronization, role calibration, biomechanical reference validation |
| Athlete UI | `AthleteBiomechanicsView`, role status, efficiency and coaching card | End-to-end data wiring and device testing |
| Hardware sensing | 100 Hz sampling requirement proposed | Sensor/MCU/BLE selection, power, casing, attachment, shock testing |
| TV / big screen | User flow and dual-screen presentation design | AirPlay/HDMI layout and performance validation |
| Other sports | Baseball, basketball, bowling support described | Sport-specific code, physics, calibration, gameplay and testing |

## Existing implementation specifics

- Golf speed estimate uses normalized input strength, a selected-club shaft scale, and fixed club preset coefficients.
- Spin and offline distance are modeled from normalized torque and heuristic factors.
- Kinematics records a time-of-peak angular speed per assigned role, sorts those timestamps, and generates a rule-based coaching message.
- The current `xFactorSeparationDeg` is derived from a difference in segment angular **speeds**; it is not a geometrically measured hip–shoulder **angle**.
- The present 0–100 "efficiency" score is a heuristic, not a validated physical percentage of mechanical energy transfer.
- The code does not implement verified sub-millisecond cross-device synchronization.

## Suggested acceptance gates

1. **Build gate:** Link all required app-side types and compile both source modules in a real iOS target.
2. **Device gate:** Stream timestamped calibrated IMU data from at least one tag with documented packet loss and sampling characteristics.
3. **Sync gate:** Test five simultaneous peripheral streams; document observed skew and dropped samples.
4. **Golf gate:** Validate predicted vs reference clubhead speed, launch, carry, and direction over multiple clubs and swing intensities.
5. **Biomechanics gate:** Compare estimated segment angles, event ordering, and feedback against appropriate motion-capture references.
6. **Sport and attachment gate:** Test durability and safe attachment separately for each sport/equipment class, especially thrown or struck balls.
7. **Product gate:** Verify dual-screen presentation, battery/thermal limits, privacy and data retention controls, accessibility, and training UX.

## Change ledger
- **2026-11-12** — Archived supplied 617-line original product/code submission.
- Extracted `TaborGolfRangeCartridge.swift` and `TaborKinematicBodyEngine.swift` as standalone source files.
- Removed two source-copy "Use code with caution." annotations that were not Swift.
- Repaired two obvious missing SwiftUI string interpolations in the extracted biomechanics view. The archive preserves the original.
- Added product/technical documentation and a vector marketing flyer. No hardware or runtime verification is claimed.

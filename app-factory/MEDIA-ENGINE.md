# TABOR 1-2-3 FACTORY — AI Media Engine

## Product objective
Low-cost AI images and video with on-device execution where compatible, optional cloud fallback, transparent estimates and user-controlled data usage.

## Proposed generation flow
1. User chooses image or video, resolution, duration, quality, privacy and maximum budget.
2. Detect device capabilities only after consent: operating system, available memory where exposed, local runtime availability and model support. Never assume all devices can run models.
3. Show options: local (model download/storage/power costs), cloud (provider charges/upload), hybrid (local editing, cloud generation).
4. Estimate transfer size and price; require approval before paid jobs or large transfers.
5. Prefer unmetered Wi-Fi for large transfers, but browser connectivity APIs are unreliable on iOS. Provide an explicit user confirmation and data-use warning; do not claim to verify Wi-Fi universally.
6. Run job, show progress and cancellation, and export user-owned assets.

## Architecture to implement
- Local adapters: supported on-device inference frameworks for iOS/Android/desktop; model licenses and hardware requirements reviewed per model.
- Cloud adapters: authorized provider APIs with server-side credentials, quotas, rate limits and per-job metering.
- Capability registry: model size, hardware compatibility, expected speed, resolution, video duration, license, costs.
- Queue and persistence: resumable jobs, secure temporary files, retention controls and retry limits.
- Cost optimizer: choose options based on user-selected budget, quality, device capacity and current provider pricing.
- UI: estimated total cost, likely time, approximate transfer size, battery/storage warnings and Wi-Fi recommendation.
- Privacy: explicit consent for cloud uploads, retention policy and deletion controls.

## Important boundaries
- On-device computation may avoid cloud inference fees, but uses electricity, battery, storage and potentially a substantial model download.
- Cellular/Wi-Fi detection is not consistently available across browsers. Never silently block or guarantee network type.
- Some advanced video models cannot practically run on phones. Use hybrid/cloud fallback.
- This document is a feature specification, not a working generator or connected provider.

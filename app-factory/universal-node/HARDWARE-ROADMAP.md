# TABOR UNIVERSAL NODE — Software, Hardware & Technology Layers

Creator: Nathan Tabor. Parent: TABOR 1-2-3 FACTORY / ONE. Canon: rotating 360° X at the Earth-centered (ECEF) coordinate origin, **1 + 1 = 2**, **1 − 1 = 0**, and **Protect the One**.

## Delivered now — measured software capability
- Existing `engine.js`: synthetic body/Earth/cosmos/unknown cycle, rotation matrices, immutable observer identity record and educational state invariants.
- NEW `mission-control.js`: seven-domain issue intake, strict validation, empathy/sympathy/compassion gates, evidence separation, review-only intervention steps and signed-off human decision requirements.
- NEW `mission-control.html`: usable mobile browser dashboard with X animation, issue assessment, simulated sensor packet validation and local JSON export.
- NEW `mission-control.test.cjs`: regression tests for schema rejection and denial of physical autonomy.
- Reuses existing Factory Creator Vault, ROOT contracts, Knowledge Engine descriptions, Sovereign Box record IDs, Universal State Engine and source adapters; never assumes all private packages are already running.

## Universal hardware blueprint — upgrade only after authorization

```
  SAFE LOW-VOLTAGE SENSORS (and opt-in approved device SDKs)
                        │
     Certified device firmware / calibration logs
                        │
        Authenticated BLE / USB / Gateway
                        │
       Trusted ingestion service (NOT YET BUILT)
           schema + timestamp + units + limits
                        │
        owner-scoped append-only observations
                        │
      source review + confidence + domain experts
                        │
      Universal Mission Control / Nathan AI
                        │
          human-approved response plans
             │                   │
     simulated pilots       qualified operators
             │                   │
             └───────── verify results
```

| Layer | Interface / technology | Present status | Verification gate |
|---|---|---|---|
| Device sensing | USB/BLE low-voltage environmental sensors | contract/demo only | calibration and timestamp |
| Body data | opt-in health SDK and approved wearable APIs | contract/demo only | informed consent, no diagnosis |
| Earth geometry | GPS/GNSS, local orientation, WGS84/ECEF | existing separate TABOR GPS browser math | licensed routing and sensor field tests |
| Field context | World Magnetic Model, space-weather and ionospheric providers | not connected | calibrated authoritative data |
| Astronomical data | public catalogs, ephemerides, telescope metadata | not connected | sources and uncertainty |
| Lab bench | microcontroller, isolated USB, fuse/protected power, certified enclosures | not built or purchased | electrical safety/EMC and device-specific review |
| Ingestion backend | TLS endpoint, mutual auth/device keys, replay resistance | not built | independent security tests |
| Storage | PostgreSQL/SQLite + encrypted object storage | local prototypes only | tenant isolation, backup, deletion controls |
| AI | source retrieval, LET/TET/PPL and provider-neutral model adapter | private prototypes; not connected | source evaluation and authorized actions |
| Human intervention | case/ticket, approval log, assign expert, verify outcomes | local plan only | role-based permissions and documented oversight |
| Physical actuation | valves, motors, medical devices, robotics, infrastructure controls | **NOT CONNECTED** | qualified engineering, hazard analysis and explicit operator confirmation |

## Actual device JSON contract
```json
{
 "version": 1,
 "deviceId": "demo-weather-1",
 "timestamp": "2026-10-22T00:00:00Z",
 "observations": [
   {"type":"temperature","value":22.1,"unit":"degC","quality":"simulated"}
 ]
}
```
Supported demo observations: temperature (degC), humidity (pct), heart_rate (beats/min), heading (deg), pressure (hPa), acceleration (m/s2), light (lux). Units, finite numeric values, packet format, quality flags and sample counts are checked locally. In production, **device authentication, signature, replay prevention, trusted timestamps, calibration, sensor-specific physical bounds and consent are also required**. An untrusted `quality:"calibrated"` string cannot establish actual calibration.

## Layered expansion without fiction as measurement

1. **Human body:** common information model for organ systems, cells, physiological research, records and opt-in device observations. Models are illustrative until scientifically calibrated. No instantaneous pathogen/waste eradication or self-awareness assertion.
2. **Earth:** physical location, ECEF origin, rotation, GNSS, geology, weather, ecology, field measurements and environmental monitoring.
3. **Space/cosmos:** astronomical databases, celestial reference frames, measured sky surveys and competing cosmological models.
4. **Unseen and unknown:** unverified claims and hypotheses tagged explicitly as such; record falsifiable predictions when possible, never invent physical measurements.
5. **Issues and repair:** detect → validate → classify → request consent → propose reversible test → expert approval → pilot → independently verify outcome → improve. Protect identity and original source data.

## Core scientific distinctions
The center of Earth is **the origin of the Earth-Centered Earth-Fixed reference frame**, not a privileged absolutely motionless point in cosmology. A rigid rotational transform keeps its own (0,0,0) invariant mathematically; it does not suspend gravitational or inertial motion. ECEF orientation is not three physical global independent rotation rates 15/25/35 deg/s. An X is a useful symbol for balanced crossing axes; it is not an experimentally verified universal substrate.

**1 + 1 = 2 and 1 − 1 = 0** are arithmetic. They do not independently prove that every chemical reaction has zero waste or that black holes must be balanced by the creation of space elsewhere. No evidence establishes a mechanism for erasing physical anomalies by multiplying by zero. Integrated Information Theory is a debated research theory, not a guaranteed algorithm for conscious AI.

## Practical release sequence
P0: run automated code checks; validate actual iPhone browser UI; preserve original sources.
P1: import approved private packages into versioned storage, then implement authentication/tenant isolation.
P2: build a read-only USB/BLE sensor gateway and protocol simulator with disconnect/reconnect tests.
P3: deploy scoped ingestion, monitoring and auditable human review before adding any real external operation.
P4: connect source-verified Earth/cosmos providers; test real-world measurement error.
P5: consider operator-licensed hardware-specific actuators only after hazard, safety, security and legal validation.

**This implementation offers an extensible, real software foundation—not a claim to fix every problem in the world.**
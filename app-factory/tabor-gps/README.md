# 🌎 TABOR GPS 🚀 — THE GENIUS GPS
Creator: Nathan Tabor. Parent: TABOR 1-2-3 FACTORY. Separate navigational application using authorized TABOR ROOT services.

**Formula:** POSITION + ORIENTATION + TIME. **Theme:** Mother Earth × Father Time. **Concept:** Absolute location *within a defined reference frame*; fluid direction relative to the user.

## Working browser prototype
- `index.html` interactive mobile-first user interface; `gps.js` calculation engine.
- WGS84 geodetic lat/lon/alt -> Earth-Centered Earth-Fixed X/Y/Z; true initial great-circle bearing; haversine distance; user-relative forward/left/right/behind.
- Equator poleward concept for Northern, Southern and exact Equator locations, without reversing geographic north and south.
- Adjustable facing heading, location permission, reverse trip, live timestamp, JSON measurement export.
- Five **environmental layers**: ECEF anchor, tangent directions/terrain, ionosphere, radiation belts, magnetopause. Only coordinate/direction layers are calculated; outer layers are explanatory, with no fake live telemetry.
- Original locally drawn diagram and compass. **11 math/behavior checks passed.**

## Real physical and operational limitations
The Earth-centered reference is rotating Earth-Fixed (ECEF), not an inertial frame, despite the creator's symbolic name for layer 01. Ionosphere, radiation belts and magnetopause are *not five independent magnetic fields*. Position is not 100% error-free: uncertainty, timestamp, signal quality, reference ellipsoid/geoid and device accuracy matter. The geographic poles never swap based on hemisphere; at the equator they lie in opposite directions along the local horizon. Personal direction depends on actual facing. No live magnetometer data or WMM declination calibration is implemented. No road network, routing, ETAs, navigation safety certification, historical map overlays, terrain sensor fusion or live space-weather service is connected.

## Production backlog for ChatGPT Work
1. Keep `tabor-gps` a separate product, with owner-scoped data permissions across TABOR ROOT.
2. Convert to SwiftUI/MapKit and Kotlin/Google Maps or another licensed routing engine; also maintain the responsive web version.
3. Implement GNSS accuracy/uncertainty display, WGS84 altitude reference handling, correct vertical axes, location permissions and stale measurement detection. Request precise location only when essential.
4. Integrate heading from permitted native motion sensors with calibration, declination and true/magnetic north mode selection; WMM2025 or later model/version/date metadata.
5. Integrate live route lookup and ETA using licensed maps provider with offline considerations and traffic source disclosure. Require explicit turn-by-turn safety testing.
6. Native 3D globe / Mother Earth and Father Time timeline with historical map orientation display (east-up vs north-up) without corrupting geographic semantics.
7. Optional ionospheric model/space-weather data from authoritative sources (NOAA/NASA and receiver corrections), labeled observed/predicted/simulated, and only when applicable to user.
8. Automated tests at equator, poles, International Date Line, antimeridian crossings, negative altitudes, local device orientation, stale GNSS accuracy and denied permission.
9. Mobile UI accessibility, offline safety language, battery use, source licensing, privacy retention, signed builds, store review.
10. Do not claim more accurate than other GNSS devices without controlled measurements against known reference stations.

Run browser prototype via the existing Factory web hosting at `app-factory/tabor-gps/index.html`. Current code passes mathematical unit checks but not a certified device-based field study.

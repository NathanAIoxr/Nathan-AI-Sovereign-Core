# Five-printer engineering blueprint — additive roadmap

**Concept:** Five independently enclosed, commercially documented FDM printers share a **supervisory print farm**, each associated with one symbolic matrix name. The networking and mechanics are conventional. A software simulation does not physically manufacture anything.

## Five queues

| Printer | Matrix | Intended safe prototyping |
|---|---|---|
| P1 | BODY | Structures, fixtures, dimensional demonstrations |
| P2 | SOUL | Heritage and family educational plaques |
| P3 | SHADOW | Light/relief demonstration objects |
| P4 | MIND | Geometric gauges, measurement samples and instructional parts |
| P5 | SPIRIT | Nonfunctional illustrative visionary architecture |

## Hardware phases

0. **Inventory and source provenance:** keep all original models, design files, source texts and attribution. Audit licenses.
1. **Single-machine pilot:** choose a documented FDM platform; evaluate printer, material, guarding, ventilation, electrical compliance and operator training.
2. **Local job preparation:** model → dimension check → slicer profile → human signoff → local printer queue → visual quality inspection.
3. **Repeat to five:** commission one safe machine at a time, each with independent stop controls, power and controller credentials.
4. **Consolidate metadata:** local server has an authenticated queue and audit log. Never expose printer APIs directly to the public Internet.
5. **Assembly:** five separately verified sample pieces may be joined after tolerance inspection; finishing a virtual progress bar does not prove a printed part.

Reference candidates (documentation, not installed in this project):
- Voron Trident: https://github.com/VoronDesign/Voron-Trident
- OpenSCAD: https://github.com/openscad/openscad
- FreeCAD: https://github.com/FreeCAD/FreeCAD
- PrusaSlicer: https://github.com/prusa3d/PrusaSlicer
- CuraEngine: https://github.com/Ultimaker/CuraEngine
- Klipper: https://github.com/Klipper3d/klipper
- Moonraker: https://github.com/Arksine/moonraker
- OctoPrint: https://github.com/OctoPrint/OctoPrint
- NASA Swarmies are historical robotics inspiration, not a printer controller.

## Pixel / voxel layers

- **Visible:** accessible interactive status, job previews and source references.
- **Behind:** stored object identity, independent category, geometry, slicer profile, revision, provenance, inspection outcome.
- **Above:** 3-D spatial coordinates and parametric models. Rendering a voxel or drawing a schematic cannot by itself validate a mechanical design.

## Guardrails

No automatic fetching/executing third-party code. No weapon models or unauthorized replications are offered in the production queue. Requires manual review for each real-world job, emergency controls, proper ventilation and fire precautions. No real hardware connections, payment systems, or private-source uploads in this public static module.

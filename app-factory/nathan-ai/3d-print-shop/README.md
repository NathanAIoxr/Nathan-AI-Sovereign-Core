# NATHAN TABOR · FIVE-MATRIX 3-D PRINT SHOP

**Simulated live web application:** \`app-factory/nathan-ai/3d-print-shop/index.html\`  
**Status:** Physical printers **not connected**. Browser runs an animated simulation only.  
**Design:** Additive component in Nathan AI, not a replacement for ONE or Factory. No random humans/faces.

## Five matrices: exact organization
MATRIX 1, MATRIX 2, MATRIX 3, MATRIX 4, MATRIX 5 maintain independent IDs, print progress and layer geometry. Each produces a virtual sample. The single shared coordination state transitions to **ONE** if and only if all five reach the maximum layer. The original five records remain visible after convergence. These are prototype labels, not a claim about Earth's physical structure.

The digital shop renders **surface (2-D pixels), behind (grid / state / voxel logic), and above (height layers)** concurrently. Each point sampled from the canvas reports X, Y, RGBA, nearest virtual node and completed Z layer. Voxel world coordinates are abstract integers X, Y = 0..8 and Z = 0..15; their pixels are a 2-D isometric projection and are not real fabrication dimensions.

Virtual demonstration objects: **Habitat dome**, **Storage crate**, **Garden pod**. These are low-resolution illustrative shapes, not approved construction, engineering, structural, machine, biomedical, or aerospace specifications. This system does not output certified meshes, machine G-code, hardware instructions, or physically constructed objects.

## Simulation vs live physical equipment
- **Simulation**: Live browser render and deterministic state updates, five independent virtual printers, 5→1 synchronization when complete, optional JSON export. No login, telemetry collection or vendor API access.
- **Physical link**: **DISCONNECTED × 5**. No existing printer device IDs, account authorizations, materials, safety validation or remote endpoints. The interface never issues network/serial commands to a printer.
- **Proposed future real-world architecture (not active)**: verified printer inventory and controller adapter, operator identity, local emergency stop, enclosure/interlocks where applicable, validated profiles, material/ventilation and fire controls, camera/sensor health checks, explicit per-job human approval, audit and signed status reconciliation. Do not auto-launch builds from scraped repositories.

A NASA-class regolith habitat printer is **not** equivalent to a tiny open-source Micron/Voron derivative. NASA's MMPACT work with ICON and the Kennedy Swamp Works/Swarmies experiments inform the concept but do not provide a verified downloadable clone of NASA's or ICON's protected industrial construction hardware. NASA publications may cover work at both Kennedy and Marshall; do not claim that a specific device was at a particular visitor facility without direct evidence.

## Gopher ants: information scouting only
Gopher ants are *animated read-only scouts* across the verified curated reference registry, not autonomous web crawlers. They do not copy code, download software, run malicious scripts, or search private computers.

| Reference | Function | Source |
| --- | --- | --- |
| PrintersForAnts Micron | Small open printer design | https://github.com/PrintersForAnts/Micron |
| PrintersForAnts Salad Fork | Another small printer design | https://github.com/PrintersForAnts/Salad_Fork |
| Klipper | 3-D printer firmware | https://github.com/Klipper3d/klipper |
| Moonraker | Klipper API interface | https://github.com/Arksine/moonraker |
| Marlin | Alternative firmware | https://github.com/MarlinFirmware/Marlin |
| OctoPrint | Printer management web interface | https://github.com/OctoPrint/OctoPrint |
| FreeCAD | Parametric CAD | https://github.com/FreeCAD/FreeCAD |
| NASA Swamp Works | Historical/current research reference, not a source repo | https://www.nasa.gov/kennedy/partnerships/swampworks/ |
| NASA / ICON lunar construction | Research reference, not open-code fabrication package | https://www.nasa.gov/directorates/stmd/nasa-enables-construction-technology-for-moon-and-mars-exploration/ |

**License note:** Listing a repository or license is not permission to redistribute all its files as if they were Nathan AI originals. Review each current license and dependencies before integration, especially GPL and AGPL code. The current app *links* to external code and does not vendor it.

## Tests

\`node --test app-factory/nathan-ai/3d-print-shop/engine.test.cjs\`

Expected behavior:
- Exactly 5 nodes with separate identities.
- No hardware connected.
- Pause prevents progress.
- Reset clears state without replacing original code.
- Complete independently then unify into ONE when all 5 finish.
- Three representative voxel shapes.
- All external references read-only; no network or printer commands in frontend.
- Local CSS and JS compile/parse.

## Next real-world project gates
1. Decide whether the physical goal is **five accessible polymer printers** or a research partnership for large-format construction printers. These are materially different technologies.
2. Create a physical device inventory and per-printer documented capabilities (machine IDs, materials, safety functions, manufacturer-authorized firmware).
3. Local operator sign-off, documented interlocks/e-stop and test coupons for noncritical objects.
4. Separate read-only telemetry, human-approved manufacturing job queues and independently audited completion states. No remote control until the whole pipeline is independently verified.
5. Responsible legal, safety and engineering sign-off before producing real functional hardware parts.

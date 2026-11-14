# Tabor Concordance — Spatial Alignment Engine (Nathan Tabor)

The uploaded spatial module is preserved verbatim in `geospatial-source-verbatim.txt`; its executable Python portion is `geospatial-alignment-engine.py`.

## Tested output

- Athens, Louisiana → Bethlehem, North Carolina: **704.2 mi**, bearing **68.7°**.
- U.S. Athens/Bethlehem/Memphis triangle normalized ratios: **1 : 2.039 : 2.9041**.
- Greece/West Bank/Egypt namesake triangle normalized ratios: **1 : 2.6477 : 2.9202**.
- Pairwise source-to-target baseline multiplier **1.1092**, relative bearing rotation **51.58°**.
- The **triangles are not similar**; namesake geography and geometry do not independently establish historic origin.

## Concordance classification

CERO: preserved user-provided original source code and supplied coordinate list. UNO: reproducible mathematical calculations from those coordinates. DOS: creative links to HUMANOID Node, '+' levels, NEXUS Replicates/Elephants/Donkeys and MAS SPIRIT.

## Methodology caveat

The source's `transform_map_coordinates` uses planar affine math on arbitrary x,y points. Feeding it unprojected longitude/latitude, while comparing to geodesic bearings, is not an exact spherical or projected alignment. The two-point solver does not determine a unique accurate full-map overlay; verify with more correspondences and residual error. A spherical Haversine distance is an approximation of an ellipsoidal Earth.

## Database integration

`geospatial-concordance-2026-11-14.json` supplies catalog entries; `creative-archive/nexus-mas-spirit/canon.json` contains typed graph nodes and bidirectional edges. Run its existing `import_canon.py` to upsert into a SQLite database. This repository commit is **not** proof of insertion into an external/live database.

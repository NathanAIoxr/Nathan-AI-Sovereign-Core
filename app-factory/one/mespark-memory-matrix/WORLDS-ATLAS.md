# Worlds Atlas — meSPARK / Universal Cartographic Core

Open [worlds-atlas.html](./worlds-atlas.html) in a browser. It is a standalone, offline searchable world-reference map with category, region, evidence-class filters, clickable geographic anchors, and JSON export.

## Contents
- `worlds-atlas.html`: interactive app with embedded catalog.
- `worlds-atlas.json`: structured catalog of 53 entries.
- `worlds-atlas.sql`: optional PostgreSQL schema; NOT applied to a live database.

## Mapping conventions
- **measured**: present-day physical reference locations, often continent centers rather than precise boundaries.
- **reconstructed**: geological configurations needing time-dependent plate rotations and paleogeographic datasets.
- **author-analogy**: real-world author-provided comparison locations, NOT canonical fictional coordinates.
- **symbolic**: textual cosmological topology without established physical location.
- **inspiration / setting**: cultural influence or a broad fictional Earth setting, not an exact surveyed location.
- **scenario**: hypothetical or modeled future; not a verified prediction.
- **unsupported / unverified**: hypothesis or legend without established physical confirmation.

No precise family addresses or other personal data are seeded. Map outlines are illustrative, not official survey geometry. Sources are research leads and must be checked before factual publication.

## Next engineering tasks
1. Replace schematic coastlines with Natural Earth vector features.
2. Load GPlates rotation files and reconstruct coordinates by epoch.
3. Add real canonical source-map scans with licensed georeferencing control points.
4. Add explicit world-to-world relationship edges with provenance and uncertainty.
5. Integrate PostGIS and evidence storage without exposing private personal anchors.
6. Add author-controlled 13-book story arcs linked to the worlds catalog, clearly separating invention and documentation.

# Tabor Academy Map

[Open the Academy Map](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/map/)

The map indexes the public Academy units, the Workbench techniques, survival drills, and Nathan Tabor Way paths and missions. The last three lists come from the existing Library database. Each lesson keeps its own route. Topic links use section anchors, and the browser URL carries up to eight previous stops so learners can return to the sections they left.

`topics.json` defines public unit descriptions and links from specific sections. A section entry lists its existing HTML selector, anchor, title, and related destinations with a reason to follow each link. Only public Academy routes are valid trail stops. The navigation applies to public HTML. Original text, JSON, staff responses and print copies retain their original handlers.

To deploy, apply `addAcademyMap(workerSource, runtimeSource, topics)` from `build.mjs` to the current Academy Worker and use the content-only upload for its existing dispatch script. Keep the current bindings. Verify home, search, a topic round trip, and the original-text route after publishing.

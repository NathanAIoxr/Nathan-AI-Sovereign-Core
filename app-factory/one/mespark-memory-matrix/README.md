# meSPARK — Universal Memory Matrix

Local-first interactive prototype integrating the Universal Cartographic Core's Earth, Human Body, Atom, Pangaea, four interpretation layers, A–Z catalog, memory anchors, 13-book storytelling outlines, 20% giving calculator, linguistic reflections, and evidence register.

## Launch
Open `index.html` in a modern browser. No installation or backend required. Records are stored in browser localStorage; export JSON to retain a copy. A schematic equirectangular coordinate grid is used instead of real satellite imagery. The matrix does not perform actual tectonic, quantum, or physiological simulations.

## Python reference backend
`python -m unittest discover -s . -p 'test_*.py'` in this folder (Python 3.10+).

## Database
`schema.sql` defines an optional PostgreSQL database. It is not automatically provisioned or populated. No personal information is included in the repository.

## Evidence and fiction
Classes: documented, personal-memory, hypothesis, analogy, fiction. Fictional stories do not generate supporting evidence. Any documented claim requires source provenance; a missing-source report is available.

## Privacy
Do not publish real childhood residences, precise personal coordinates, or identifying third-party data as sample seeds. Browser storage is local but not encrypted. This prototype does not sync to an external database.

## Development
Future integration: PostGIS, GPlates, astronomical and anatomical datasets, authentic basemaps, source-backed historical layers, provenance checks, and more sophisticated narrative generation. Preserve original source texts separately from generated creative expansions.

## Nathan AI private archive bridge

The additive `private_sync_bridge.py` converts the owner's **local** `memory_matrix.sqlite3` index to the existing meSPARK `mespark-v1` JSON format. The original source documents, full source text, names, coordinates, and private SQLite database are **not committed to this public repository**.

```sh
python private_sync_bridge.py --db /path/to/memory_matrix.sqlite3 --out /private/mespark-public-only.json
python private_sync_bridge.py --db /path/to/memory_matrix.sqlite3 --out /private/mespark-owner.json --include-private
```

The first command excludes private records; the second is an **explicit owner-only local export**. Exported entries contain their titles, description, source SHA-256 and stable IDs, but not the raw source transcripts. Store the JSON in a trusted private location; the browser's local storage is not encrypted.

In meSPARK open **Evidence → Import JSON** and select the owner export. Imports merge on stable node IDs without replacing existing browser records. Existing records win when IDs collide to preserve owner edits; unchanged repeated imports add zero records. This is a user-controlled local exchange, **not** an always-on provider connection, cloud synchronization, or Airtable write.

The Story Engine accepts any positive JavaScript-safe integer volume count and previews 30 outlines at a time; volumes beyond the preview are configured, not actually authored. The companion local SQLite registry also configures volumes on demand. The 75/25 historical processing arrangement and the generic 20% giving calculator remain distinct.

Run `python -m unittest discover -s . -p 'test_*.py'` for the Python engine and private bridge tests.

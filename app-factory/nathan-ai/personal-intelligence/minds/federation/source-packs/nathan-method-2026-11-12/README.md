# NATHAN AI — ONE DATABASE FEDERATION v074
## Nathan Tabor Method · Truth & Incentives · 40 Pillars · Historical Sources · Discovery Trail

**By John Nathan Tabor · 2026-11-12 · additive source pack**

This folder preserves **11 prior generated artifacts as independent files** with their SHA-256 digests and original bytes. Source assets include:
- 101 historical research-source references (research leads; confirm claims from primary works before treating them as proven)
- THE NATHAN TABOR METHOD, original and V2 24/25-component maps
- Truth & Incentives: 101 supplied sayings and four incentive mechanisms, with the Good Samaritan, Job, and relevant Gospel passages as textual comparisons
- 206-bone index, 40 narrative pillars, five new anatomical/symbolic overlays, 12 cranial nerves
- Standalone phone-compatible HTML explorers

The machine-readable index is **not an overwriting replacement**: [data/nathan-method-integrated-v074.json](../../data/nathan-method-integrated-v074.json) is consumed by the EXISTING \`federation.py\` engine and enriches the *same local/private ONE Federation database*. It indexes **522 records** and **519 proposed relationships** from the preserved sources; separate originals are not silently reworded. Each index row has a source path and an original-file checksum. A link between topics is a candidate relation, not verification that one caused the next.

The discovery log is [word-image-discovery-trail-v074.json](../../data/word-image-discovery-trail-v074.json). It preserves the creator's exact statement about moving between topics when prompted by a **word or image**. It distinguishes observed topic order from unknown individual trigger words/images. Do not fill in unseen triggers.

### Run against an owner-selected *private* database

~~~sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation
python3 "$F/federation.py" --db "/private/ONE_Federation_Master.sqlite3" init
python3 "$F/federation.py" --db "/private/ONE_Federation_Master.sqlite3" ingest "$F/data/nathan-method-integrated-v074.json"
python3 "$F/federation.py" --db "/private/ONE_Federation_Master.sqlite3" run
python3 "$F/federation.py" --db "/private/ONE_Federation_Master.sqlite3" search "word or image"
python3 "$F/federation.py" --db "/private/ONE_Federation_Master.sqlite3" status
python3 -m unittest discover -s "$F" -p test_nathan_method_v074.py -v
~~~

The source pack adds **522 records** to whatever records are already in that master. In the public synthetic workflow, the existing 763 mind records + 41 Meru records + 522 indexed source records should produce **1,326 federation records** before optional Ancient Minds imports. There is no automatic synchronization of private Library, Airtable, devices or AI providers. Existing apps/SQLite originals remain separate.

**PRESERVE → INDEX → RELATE → DERIVE — NEVER REPLACE.** Quoted proverbs are not universal laws. Anatomical observations and historical scholarship are separate from cross-cultural symbolism. Preserve author phrases verbatim and keep derived synthesis and review separate.

This is public GitHub source/index material because the owner requested it. No owner-held private SQLite master, credentials, personal multimedia archive, or private family address book was uploaded.

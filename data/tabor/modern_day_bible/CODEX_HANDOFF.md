# CODEX HANDOFF — THE MODERN DAY BIBLE BY NATHAN TABOR

Start at this directory on GitHub `main`: `data/tabor/modern_day_bible/`.

**Confirmed:** 100 numbered original source lines (#102–201) in `stories_102_201.json` and `volume_2_102_201_original.txt`. Separate existing kinship source is `../biblical_kinship_52_entities_2026-11-14.json` (52 index rows). Seven original aisle labels are recorded in `aisle_labels_7.json`, without invented story placements.

**Create database:** `python data/tabor/modern_day_bible/build_sqlite.py` from repository root. This outputs `The_Modern_Day_Bible_RECOVERED.sqlite` in this directory. Alternatively import `The_Modern_Day_Bible_RECOVERED.sql` into a new SQLite database via `sqlite3 The_Modern_Day_Bible_RECOVERED.sqlite < data/tabor/modern_day_bible/The_Modern_Day_Bible_RECOVERED.sql` (execute from repository root).

**Important gaps:** #202 is absent from source despite the heading, and the 1–101 and 203–404 complete story texts and earlier claimed 303/404 output packages are not present on main. Do not invent them or falsely claim restoration. Preserve original wording, no unsolicited theology or content changes. Verse verification is a separate layer; source text is not independently fact-checked. 52 kinship titles are **not** 52 proven extra unique numbered stories.

# THE MODERN DAY BIBLE BY NATHAN TABOR

This directory is a **partial recovery** of the project and is intended for Codex and all future restoration. This is not a claim that the earlier 404-entry local database was ever uploaded to the repository.

- **100 exact numbered story entries recovered:** #102 through #201, from `volume_2_102_201_original.txt`. Each story's original full line is stored in `stories_102_201.json`.
- **Missing #202:** The supplied heading says 182–202 and the closing text says 202 stories total, but no numbered #202 appears in the source file. Do not invent it.
- **Previously claimed 303/404 entries:** Prior ChatGPT sessions described local SQLite/CSV/ZIP packages of 303 and 404 stories, but those complete outputs are **not present in this repository and have not been reverified here**.
- **Separate collection:** `../biblical_kinship_52_entities_2026-11-14.json` already holds 52 additional *indexed records*, with titles and references but not full original descriptions. Do not treat them as verified unique additional story narratives or silently merge them with numbered items.
- **Original design:** seven named aisles in the user's source manuscript. The exact original aisle titles/placements are not recovered in this file. Five section headers in the supplied Volume 2 are preserved exactly but are not represented as replacements for the seven original aisles.
- **Authorship and verification:** This is text supplied in conversation, preserving phrasing and references. It is not a KJV quotation collection, original-author verification, or independent verse-by-verse fact-check.

To rebuild a usable local database in a repository checkout:

```bash
python data/tabor/modern_day_bible/build_sqlite.py
```

It creates `The_Modern_Day_Bible_RECOVERED.sqlite` containing separate `stories` and `kinship_index` tables, retaining source text and provenance. The database is a generated output, not proof the full 404-entry corpus has been recovered. Never replace any original author wording with editorial commentary. 

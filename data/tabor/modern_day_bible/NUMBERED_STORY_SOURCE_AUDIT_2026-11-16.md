# Numbered story source audit — November 16, 2026

Requested scope: all numbered Modern Day Bible stories, expected by the owner to exceed 1,000, preserving original wording and the seven existing aisle labels.

## Located source sets

| Source | Numbering | Located material | Reader classification |
| --- | --- | --- | --- |
| `data/tabor/scripture_passage_entities_2026-11-14.json` | #1–101 | 101 titles, verse references and source categories; original descriptions explicitly absent | `numbered-index`, original `tabor-scripture-*` IDs |
| `data/tabor/modern_day_bible/stories_102_201.json` and `volume_2_102_201_original.txt` | #102–201 | 100 exact supplied original lines | `numbered-story`, original `MDB-*` IDs |
| `data/tabor/biblical_kinship_52_entities_2026-11-14.json` | Separate #1–52 sequence | Titles and references; complete original descriptions absent | Separate kinship index |

The first two sources contain **201 numbered entries across two source sets**. Only 100 have original story lines recovered. Their adjacent numbering does not establish that the first source is a recovered full Volume 1. Source IDs, categories, references and availability remain separate. No missing prose was generated.

The seven labels in `aisle_labels_7.json` match the owner's requested shop-style organization. Existing provenance is retained. Original per-story placement within those seven aisles has not been located; no new assignments were inferred from titles. Original source-section categories are preserved independently.

## Wider search and remaining leads

- Fetched all current GitHub branches (262 remote-tracking references), inspected historical object paths and recovered branch-source objects for Modern Day Bible archives and missing volumes.
- Examined 39 workspace ZIP archives by entry names and two available SQLite files by table inventory. These did not provide a larger numbered corpus.
- Searched connected Notion, Google Drive and the Airtable master index for the project and larger-numbered collection leads. Retrieved matches did not expose a 1,000-plus-story collection.
- The existing `MASTER_RECOVERY_MAP_2026-11-14.md` points to the private ChatGPT Library file `/Main Database/MASTER_LIBRARY_101-901/TABOR_MAIN_DATABASE_101_901.sqlite3`. That file's bytes are not present in this workspace or accessible through the enabled Library tools. A Library reference is not an imported database.
- A recovered older print-shop source clarifies that **496 sheet rows** describe architectural/object schematics: 321 master, 46 gates, 13 adornment, 13 furniture, 9 hardware, 10 materials and 84 weapons/attributes. They are explicitly not 496 distinct Bible objects, much less 496 recovered numbered stories. Evidence: `recovered-source/github-branches/objects/f9dc1363a8606ac8db4dfe8bb11dff50c2657a7b.source` (`app-factory/3d-print-shop/docs/SOURCE_RECOVERY.md`).
- Prior 303/404-story package claims remain unverified without the source packages. More than 1,000 numbered stories have not been located in the searched material.

The remaining needed source is the owner's larger numbered CSV/SQLite/ZIP or original story-volume export, particularly the referenced private master database. Full original descriptions for #1–101, #202 and later numbered story spans remain unlocated. This audit reports search coverage, not proof that those sources do not exist elsewhere.

## Changes delivered

The public and authenticated readers now include the separately numbered 101-entry scripture index with a dedicated filter and missing-description status. Original full-text story count stays 100. The seven aisle labels are preserved. Import and source-preservation tests verify the two numbered source sets remain distinct.

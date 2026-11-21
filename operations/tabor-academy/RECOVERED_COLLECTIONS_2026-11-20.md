# Tabor Academy — Recovered Collections and Missing Lesson Investigation

Date: 2026-11-20
Status: **9 source collections linked in live D1; original ~3,000 uploaded lessons not yet independently located or imported.**

## Verified live source counts
| Source D1 | Table | Rows | Classification |
|---|---|---:|---|
| tabor-academy-apprenticeships | records | 4,173 | apprenticeship catalog |
| tabor-academy-apprenticeships | variants | 3,708 | training variants, overlap possible |
| tabor_academy_db | academy_learning_methods | 101 | methods |
| tabor_academy_db | lesson_plans | 23 | lesson plans |
| tabor_academy_db | modules | 21 | modules |
| tabor_academy_db | library_catalog | 37 | library entries |
| tabor_academy_db | card_game_registry | 25 | card-game records |
| tabor_academy_db | chess_variant_catalog | 26 | chess variants |
| tabor-academy-blueprints | blueprint_lessons | 30 | Blueprint lessons |

Sum of source table row counts: 8,144; **not** unique lessons. Do not conflate catalog records or training variants with full lessons.

## Verified action
Created table `tabor_academy_db.academy_external_collection_directory_v1` and inserted nine references with source database IDs, table names, classifications, live counts, and `import_status=linked_not_copied`. Read-back confirmed 9 entries and 8,144 referenced rows. No original content was deleted, migrated or overwritten.

Database IDs:
- Apprenticeships `0070dfb0-9b29-4fc9-b8ce-c1330349a19d`
- Academy `f9708fd8-af51-4d79-b6c2-edb532f53fc0`
- Blueprints `7a426090-8b0b-4f85-8a68-8b5c8e6fc478`

## Remaining critical work
1. Locate original November 20 user uploads and text/lesson sources in conversation files or library, if accessible.
2. Reconcile original items against live Academy `lesson_plans`, other modules, apprenticeships and 30 Blueprint lessons by canonical content identity.
3. Tag source kind, age tier, domain, original text, authorship, provenance, and deduplication outcome.
4. Import verified **actual lessons** into an appropriate existing Academy curriculum table without flattening apprenticeship catalog records into lessons.
5. Expose the linked collections in the Academy UI and test access.
6. Record exact unique lesson count, GitHub commit, Cloudflare D1 receipt, and deployment ID.

**Do not report 3,000 recovered lessons.** The user said they supplied approximately 3,000 today, but those original payloads have not been located in this audit.

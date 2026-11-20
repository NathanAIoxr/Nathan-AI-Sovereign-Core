# Tabor Academy · Nine Pillars

By Talking Mammal Nathan Tabor. [Open the live institutional workbench](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/).

The nine pillars and original handoff are in `blueprint.json` and `source-handoff.md`. The release includes the first published course, *From Question to Evidence*, with a syllabus, scope and sequence, 50-minute lesson and two rubrics. Public practice uses the stored 90% cutoff. The governance sample records the status of the register. Formal registration requires its own filing and verification.

## Comparative civics

[Open Comparative Civics & Legal Language](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/civics/) for a 50-minute primary-source lesson on the 1776 declarations, Diné Fundamental Laws, and the 1868 Navajo Treaty. The unit has its own syllabus, source text, readings, and 90% rubric. It is also indexed in the Academy Map. The submitted comparison and dialogue are preserved verbatim in `civics/source.txt`.

## Cloudflare deployment

The existing Academy keeps its Library of Tabor binding. The institution feature uses the `ACADEMY_DB` D1 binding, `ACADEMY_CACHE` KV binding, and `ACADEMY_LIBRARY` R2 binding. `cloudflare.json` records the binding targets. R2 serves the versioned blueprint through the Academy Worker.

Run `node --test test.mjs` with Node.js 24. `node deploy.mjs` applies the retryable D1 migrations, uploads a versioned blueprint, and updates the feature in the current Academy dispatch Worker. `node verify.mjs` checks the production site. GitHub Actions can run the same steps with the repository's `CLOUDFLARE_ACCOUNT_ID` and scoped `CLOUDFLARE_API_TOKEN` secrets.

## Student records

The institution's `/api/students`, `/api/attendance`, and `/api/transcripts` routes require a bearer credential. Configure a strong secret of at least 32 characters as `ACADEMY_STAFF_TOKEN` on the Academy dispatch Worker before using these routes. The first release has an empty student ledger.

- POST `/api/students` accepts `student_id`, `full_name`, and `enrollment_date` as YYYY-MM-DD.
- POST `/api/attendance` accepts `student_id`, `syllabus_id`, `session_date`, and `status` as `present`, `absent`, or `excused`.
- POST `/api/transcripts/record` accepts `student_id`, `assessment_id`, and numeric `score`. Passing an eligible summative assessment appends a transcript entry. An exact retry returns the existing entry.
- GET `/api/transcripts?student_id=…` retrieves that student's official ledger.

Staff API requests use JSON under `/tabor-academy/institution`.

## Human Learning, Survival & Mastery

The Institution serves three tracks under `/institution/mastery/` with six lessons and a capstone each. The historical navigator draws from the preserved 101-method registry and the separate World timeline data to show 30 original additions and 18 extensions. The six survival lessons include links to the 27 existing practice stations. See `mastery/courses.mjs` for the source-backed lessons and `deployments/conductor/academy/human-mastery.json` for the release handoff.

Regenerate the D1 migration from the repository root after editing the catalog and before publishing:

```sh
node app-factory/tabor-academy/institution/mastery/data.mjs > app-factory/tabor-academy/institution/migrations/0005_human_mastery.sql
```

Public course practice stores pause and completion markers on the current device. The Institution’s existing staff-authorized SIS handles formal results.

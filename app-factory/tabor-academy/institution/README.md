# Tabor Academy · Nine Pillars

By Talking Mammal Nathan Tabor. [Open the live institutional workbench](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/).

The nine pillars and original handoff are in `blueprint.json` and `source-handoff.md`. The release includes the first published course, *From Question to Evidence*, with a syllabus, scope and sequence, 50-minute lesson and two rubrics. Public practice uses the stored 90% cutoff. The governance sample records the status of the register. Formal registration requires its own filing and verification.

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

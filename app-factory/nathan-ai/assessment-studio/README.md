# Assessment Studio · The Nathan Tabor Way

[Open Assessment Studio](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/assessment-studio/)

The independent Nathan AI app combines a provider directory with category filters, a runnable public-domain IPIP Big Five questionnaire, QI reasoning practice, QE perspective scenarios, and a personal results history. Personal data stays in the current browser’s local storage. You can log an instrument outside the directory under **Other assessment** and export your results as JSON.

The Big Five implementation uses the exact [IPIP 50-item sample](https://ipip.ori.org/New_IPIP-50-item-scale.htm) and [IPIP scoring directions](https://ipip.ori.org/newScoringInstructions.htm). Each factor is reported as a raw total. QI practice shows correct answers and elapsed time. QE practice shows agreement with the explanations for those scenarios. The provider directory identifies professional instruments, publisher questionnaires, and online practice. Third-party results are entered manually, with the original score type, edition, source, and assessment date. Rankings compare attempts within the same instrument, edition, measure, unit, and matching comparison group. Provider ranks preserve their original scale, where first place is 1.

## Run locally

```sh
node --test check.test.mjs
node build.mjs /tmp/nathan-assessment-build
python3 -m http.server 8080 --directory public
```

The app runs as a separate Worker in the existing `nathan-tabor-platforms` namespace. The Tabor Apps gateway routes its public URL. The app Worker serves static files and `/healthz` with the build fingerprint. The GitHub workflow builds and tests on changes and deploys the Worker on main when the repository provides its Cloudflare deployment credentials.

## Compute and storage registration

[Supercomputer registry](https://tabor-apps-nathan.pages.dev/cloud-slayer/supercomputer) · [Hypercomputer registry](https://tabor-apps-nathan.pages.dev/cloud-slayer/hypercomputer) · [Release health](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/assessment-studio/healthz)

Cloud Slayer uses the same app record in both compute views. The record carries only launch metadata. The [D1 and local SQLite migration](../digital-flubber/cloud-slayer/migrations/0003_assessment_studio.sql) can be applied to an existing registry. Release bundles are indexed by their build fingerprint. Scoring runs on the visitor’s device and saves only in that browser unless the visitor exports a copy.

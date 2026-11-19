# Nathan Tabor’s installable apps

Open the [Tabor Apps directory](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/).

- [TABORBOY](https://taborboy.pages.dev/app/) · Identity Blank, Motion Lab and Tabor Sideline Bait.
- [TABORPOOL](https://taborpool.pages.dev/app/) · Broadsheet archive, checksum verification and ledger sandbox.
- [TaborPoolBoys](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/taborpoolboys/) · Browse three editorial covers, pick an edition and save an issue.
- [KRISTIAN Plaque Archive](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/kristian-plaque/) · Nathan Tabor’s plaque, corrected wording, and a record of the edits.

TABORBOY and TABORPOOL retain the separate Pages projects and deployment workflows in this repository. TaborPoolBoys and the KRISTIAN Plaque Archive run as separate Workers in the account’s `nathan-tabor-platforms` namespace. Their install manifests, service workers, and local storage keys are independently scoped. The existing cockpit exposes only the two allowlisted application routes and the directory. Each new project has a six-hour GitHub Actions health check.

Open an app in iPhone Safari and use Share, Add to Home Screen, then Open as Web App.

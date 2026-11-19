# Anubis & Karma

A standalone Tabor World story and game based on Nathan Tabor's original premise.

> the fight between Anubis and karma … sin vs righteous aka 0 vs 1 … end that war

## Release order

| Stage | Archive entry or release | Cloudflare Worker |
| --- | --- | --- |
| 1 | The Scales of Anubis · `COGNITION:COS-33:022` | `tabor-anubis` |
| 2 | The Karma Balance Sheet · `COGNITION:COS-33:020` | `tabor-karma` |
| 3 | Playable finale and *The Last Weighing* | `tabor-anubis-karma` |
| 4 | Domino release verification | `tabor-domino` |

The two record IDs come from the Connected Atlas. *The Last Weighing* is a new story adaptation. In its game, 0 leaves a case open and 1 advances a case after an action supports an accountable repair. Anubis weighs the record. Karma follows its consequences. The game closes when the record and the observed repair agree.

The Domino Worker checks the first three Workers through Cloudflare service bindings, compares the GitHub main-branch release manifest, and checks the three linked project homepages. Its report is available at `/api/chain`. Its hourly Cron Trigger logs the same verification and surfaces a failed check in Cloudflare. Each check concerns the stated release or endpoint. 

## Build and run

Use Node 22 or later. This app has no runtime package dependencies.

```sh
npm test
npm start
```

Preview an entry or the verification board with `npm start -- anubis`, `npm start -- karma`, or `npm start -- domino`.

The GitHub workflow tests release changes and supports ordered Wrangler deployment from `main` when the repository has `ANUBIS_KARMA_DEPLOY_ENABLED=true` and the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` Actions secrets configured. One deployment runs at a time. The four Wrangler configurations can also be deployed in the order above.

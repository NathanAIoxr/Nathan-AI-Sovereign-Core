# Nathan AI 🚀 · Nathan Tabor Labs Home

The Labs Worker serves the Nathan AI home, the original science workbench at
/workbench, and the Mind, Hounds, and 134-challenge player editions. Mind mode
can replay an original shot and simulate the identical release at a different
wind setting. An alternate run leaves the original score and recording intact.

The home keeps Mind, Brain, and Skull on the front page. The /systems directory
offers search across play, workbench, reading, worker, and owner destinations.
The /workers view contains service checks, role definitions, and receipts.

The home uses the Hive v.9 role definitions and Ant Farm routing from PR #278.
Its three named jobs check the Labs solvers, Ant Farm routing, and arithmetic
and access boundaries. The scheduled home pulse checks five existing Cloudflare
services and keeps 32 status receipts. The fleet summary stores a bounded set of
aggregate counters from the public fleet; other endpoints contribute status only.
The old Labs 24-hour campaign uses its
original tables and retains its original end time. Both are triggered by the
existing 15-minute cron.

The public UI links to the existing Absolute Intelligence and ONE owner
consoles. It does not pass credentials, call owner mutation endpoints, or
include the private local archive. Owner actions remain in those consoles.

## Protect Innocence

The [public Hounds arcade](https://nathan-tabor-labs.nathantaboract.workers.dev/play/hounds) opens directly in the protection challenge. The Hounds clear a gate, a shot must keep the gold Spark safe, and touching it earns zero. The [restoration ledger](../../docs/INNOCENCE_RESTORATION.md) records the source and checks.

## Validate

```sh
node verify.mjs
node --test home.test.mjs
```

## Deploy

Use worker.mjs as the main Cloudflare module. Include its imported .mjs files.
Apply home-schema.sql to the existing nathan-tabor-labs-launch database and
keep the PUBLIC_LABS_DB binding and existing cron. Keep the campaign and
receipts tables from schema.sql. Deploy only the Nathan Tabor Labs Worker.

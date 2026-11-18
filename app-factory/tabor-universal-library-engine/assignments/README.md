# Library of Tabor task assignments

The assignment Worker reads the Tabor World release ledger and gives each open task a named Worker Bee and supervising agent. Each Bee runs narrow checks against the two existing services. Each agent evaluates those checks and records the remaining action. New ledger items receive a triage pair until their specialist checks are defined.

The dashboard and read-only receipt API are published at https://library-of-tabor-assignments.nathantaboract.workers.dev/. Scheduled checks run every 15 minutes. Receipts are idempotent per window, and the latest 30 days are retained in the existing Tabor deployment-ledger D1 database. Apply migration.sql before deployment. No provider secrets or account data are included in the receipts.

The work stays open in the source ledger until its own completion criteria are met. Runtime checks cover published records, database status, game links and installability. A physical phone test, provider approval, discovery of additional works, or implementation of another game still requires its own evidence.

Run `node --test worker.test.mjs` with Node.js 24 or newer from this directory.

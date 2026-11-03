# Nathan AI Work & Assets

Open `index.html` through the repository static server or GitHub Pages. No dependency installation, credentials, account connection or build is required. Shared Nathan AI skins and the command palette work here too.

## Work

Create projects with an outcome, stage, target date and an existing Nathan AI module reference. Add tasks with a project, priority, due date, status and acceptance criteria. The overview shows completed-task progress without inventing tasks or marking work complete automatically. A project or wallet cannot be deleted while another record references it.

## Wallet and asset records

The six financial tables are Wallet Registry, Crypto Assets, Transactions, Exchanges, Mining Rewards and Portfolio Reports. Store public receiving addresses and public transaction references only. Asset records are balance snapshots, not an automated ledger or market valuation. Enter actual holdings rather than all conceptual coin definitions; the existing 21-coin source registry is linked separately. Contracts/asset identifiers distinguish tokens sharing a symbol. Transaction identity includes chain, transaction ID, transfer index, wallet and asset; represent separate same-symbol transfers with distinct indexes.

Every record has an origin, verification state, evidence reference and notes. Owner verification requires evidence but does not establish independent account verification. Imported records remain imported in reports even when marked owner-verified. Estimates, missing amounts and unverified records never enter the owner-verified balance column. All arithmetic uses exact base-10 integer units, with at most 18 decimal places. Cost basis is included only when supplied with its currency; currencies and token contracts are not mixed. Snapshot reports preserve their source summary and originating revision, including zero balances and missing amounts. They do not reconcile transactions into balances, establish taxes owed, fetch prices or verify on-chain ownership.

No Airtable or Finances account API is callable from this browser workspace. Exchange synchronization is manual and labeled accordingly. CSV table exports can be mapped to Airtable; the browser never creates an external base, signs transactions, initiates trades, changes pools or controls miners. Provider setup and read-only telemetry remain in the separate mining-wallet integration module.

## Backup and audit

The workspace uses only `nathan-ai.command-center.v1` in browser localStorage. Other Nathan AI records are untouched. It supports at most 2,000 records, 10,000 local audit events and a 3 MB JSON backup. Browser storage is not encrypted and may be cleared by the browser. Back up before clearing site data or changing browsers. No reset-all action is supplied.

Backups are JSON with this envelope:

```json
{
  "schema": "nathan-ai.command-center.v1",
  "revision": 0,
  "records": {
    "projects": [], "tasks": [], "wallets": [], "assets": [],
    "transactions": [], "exchanges": [], "mining": [], "reports": []
  },
  "audit": []
}
```

Use a downloaded backup as the template. Fields and enum options are declared in `engine.js`. Record IDs must be stable, unique alphanumeric identifiers (hyphens and underscores allowed); foreign keys reference project or wallet IDs. Imported records must retain their true origin. Unknown fields are discarded and known fields are validated before storage. Recognizable credential patterns are rejected; this does not make arbitrary pasted content safe, so never import secrets.

Imports validate the entire document and all relationships before changing anything. The confirmation shows the added and skipped record counts. Exact duplicates are skipped, conflicting identities or changed records are rejected, and all existing records are retained. Alternate IDs for an existing identity are rejected to preserve relationships. Imports record new local import events; they do not trust another file's history as local events. Backups can be reimported without duplicate records. To edit a conflict, use the editor rather than silently replacing local data.

Audit events record revision, action, table, record ID and time, without copying full private values into the log. This local history is not tamper-proof and does not provide a cryptographic or external audit. Failed saves retain the previous workspace; stale-tab saves are rejected and preserve the open form. Read failures do not overwrite stored content. CSV exports quote fields and neutralize spreadsheet formula prefixes. Exports and imported backups contain your own private records; keep them private.

## Validation

`node --test app-factory/nathan-ai/command-center/engine.test.cjs` covers decimal precision, source-separated reporting, credential rejection, duplicate identities, atomic imports, references, record edits, CSV safety and malformed backups. Browser validation additionally checks project/task creation, wallet/asset creation, report generation, persistence, duplicate rejection, audit history, dialogs, mobile layout and cross-tab conflict handling.

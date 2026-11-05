# NATHAN AI — Program Jobs, Tasks & Source Recovery Atlas

**Creator:** Nathan Tabor  
**Purpose:** Organize current source and preserved historical software by the job performed and tasks remaining.  
**Status:** Working browser-local atlas, deterministic review engine, tests, and offline reconciliation. **Not a claim that all historical products are built or deployed.**

[Interactive Jobs Workbench](./index.html) · [357-record catalog](./catalog.json) · [Full prioritized build plan](./TASKS.md) · [Existing recovery index](../build-recovery/) · [Five Guardians](../five-guardians/)

## Source-backed evidence inventory

| Evidence class | Count | Evidence boundary |
|---|---:|---|
| Code-bearing directories on main | 107 | Source code present, not proof of independent working apps |
| Browser interface entrypoints | 76 | Historical recovery URLs still present on main |
| Historical original-system names | 92 | Recovered references; complete source not necessarily linked |
| Original architecture modules | 54 | Named modules; actual implementation may be elsewhere |
| Operations specifications | 13 | Read-only designs, not deployed operations |
| Owner-held private archive anchors | 14 | Source filenames preserved; private contents absent |
| Historical Hall of Mirrors recovered from a branch | 1 | Original historical code and tests preserved unchanged in main; still not antivirus |
| **Evidence records** | **357** | **Overlapping kinds; NOT 357 distinct completed products** |

Counts come from the November 5, 2026 repository snapshot and the existing source recovery register. The earlier recovery totals of 6,056 master records, 383 technology records, 273 normalized technology titles, and approximately 5,447 saved-file records are historical archive descriptions, **not verified completed-app counts**.

## Jobs and their required tasks

| Job | Representative tasks |
|---|---|
| Threat defense, malware analysis and dehacking | Restore detector source, harmless test fixtures, owned-scope containment, audit and rollback |
| Encryption, identity and permissions | Cryptography, key lifecycle, authentication, owner-consent and revocation |
| Backups and restoration | Locate source, SHA-256, exact-byte ZIP exports, interrupted restore and offline copies |
| AI models, agents and reasoning | Recover agents, route jobs, test model adapters, track provenance |
| Coding, apps and automation | Build/test/deploy, dependency pinning and rollback |
| Hardware and embedded firmware | Preserve schematics, compile firmware and bench test |
| Language, research and knowledge | Provenance, parsers, reversible encodings, search and backups |
| Games, publishing and media | Original assets, user experience, accessibility and release rights |
| Commercial ledgers | Financial math tests, authorized identity and provider-gated live transactions |
| Community and education | Privacy, age/consent protections and factual accuracy |
| Governance and accountability | Evidence log, human approvals, refusals and revocation |
| Original-source triage | Find missing source, confirm what a historic name actually does |

Job grouping is an **initial classification of evidence**. Review ambiguous names before treating an assigned job as an author's verified original design.

## Exact five-gate definition of done

1. Original source and provenance verified.
2. Reproducible build, dependencies and working demonstration.
3. Actual tests executed and passed.
4. Security, privacy and consent reviewed.
5. Installation, release and rollback confirmed.

Each record begins with **no independently verified completion**. Users can record evidence notes and their own review decisions in the browser. Five owner-marked passes are **not** an independent security certification. They do not establish that the whole historical archive is 100% finished.

## Run the dashboard locally

Serve the checked-out repository from its root:

    python3 -m http.server 8765

Then open http://localhost:8765/app-factory/nathan-ai/program-jobs/ (or visit the same path on GitHub Pages after publication). The browser loads the packaged public JSON, never executes inventoried programs or scans external systems, and keeps review notes in localStorage. Do not enter private secrets or sensitive source into browser notes. Export review JSON for a portable owner-controlled record.

## Match historical private source on Ubuntu

The previous read-only scanner produces all_files.csv for **owner-selected local folders and ZIP metadata**. The new read-only matcher compares filenames and original project hints to the recovery catalog without uploading data:

    python3 app-factory/nathan-ai/program-jobs/reconcile_local.py --catalog app-factory/nathan-ai/program-jobs/catalog.json --inventory /path/to/private/all_files.csv --out /path/to/private/job_matches

It writes candidate_matches.csv, still_unmatched.csv, and summary.json. Matches are **hints only**, not proof that a historical program is complete. Paths and hashes can identify private work; keep the results out of public GitHub.

## Tests

    node --test app-factory/nathan-ai/program-jobs/engine.test.cjs
    python3 -m unittest discover -s app-factory/nathan-ai/program-jobs -p 'test_*.py'

These verify the catalog and review engine, **not** all underlying historical programs. The dashboard is an additive index. No original apps, private ZIP archives, authorial sources, or separate modules are replaced.

**Guiding order:** Preserve → Find → Audit → Build → Test → Approve → Release. No invented 100%.

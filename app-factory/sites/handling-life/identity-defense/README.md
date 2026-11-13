# Handling Life — Identity Defense worker integration

**Project owner / source attribution:** Nathan Tabor · Handling Life. `1+1=2` build; `1-1=0` clear. Preserve author originals and isolate derivative implementation.

## Repository status (2026-11-13)
This directory is a **scheduled integration slice** of the separately packaged **Identity Defense v0.2 local FastAPI + SQLite dashboard**. The complete local bundle is not represented by this directory. There is no public web app or private data exposed here.

Files:
- `worker.py`: bounded Google News RSS intake, identity-anchor triage, deduplication by source URL, and optional Airtable create-only synchronization.
- `test_worker.py`: offline automated checks. No network, key, biometric analysis, or takedown submission.
- `.github/workflows/handling-life-identity-defense.yml`: every 30 minutes on the default branch, subject to GitHub Actions scheduling availability, plus CI and manual dispatch.

## Database integration
Private destination: **NATHAN AI — ONE MASTER INDEX**, table **Identity Defense Cases**. Central **Federated Worker Jobs**, **Apps & Modules**, and **Production Tracker** link the system to ONE without altering unrelated source databases.

Configure these *GitHub Actions secrets* (never commit their values):
- `HANDLING_LIFE_AIRTABLE_TOKEN`: minimum-scope Airtable personal access token with read/create permissions for this base/table.
- `HANDLING_LIFE_AIRTABLE_BASE_ID`: the exact master Airtable base ID.
- `HANDLING_LIFE_AIRTABLE_CASE_TABLE_ID`: the exact Identity Defense Cases table ID.

Without all three secrets, the scheduled task scans public headlines only and **does not persist cases**. No inferred “live connection” or “24/7 server” claim is made. GitHub cron only runs after the workflow is present and enabled on the repository's default branch.

## Worker roles and boundaries
1. **Harvester:** collect only bounded news RSS headlines, publication metadata and source pointers.
2. **Identity Resolver:** compare distinctive positive and known other-person anchors; contradictory evidence stays `NEEDS_REVIEW`.
3. **Deduplicator:** generate stable SHA-256-derived source keys.
4. **Risk Triage:** flag *possible* impersonation/privacy issues, without declaring a deepfake or defamatory statement proved.
5. **Vault Curator:** keep owner-confirmed records distinct from unverified candidates; the local dashboard owns confirmation.
6. **Notice Drafter:** create **unsent** requests after owner review in the local app; no GitHub worker is authorized to send notices.

The current scheduled CLI implements roles 1–4 in bounded form. Roles 5–6 remain separate/manual and **are not autonomous active bots**. No reverse image search, face matching, C2PA verification, full-text crawling, live court/policy decisions, mass SEO manipulation, or automatic external takedowns are included.

## Privacy and correctness
- The database holds only source-level case metadata and review flags. Do **not** store exposed street addresses, numbers, biometric templates, passwords, or private evidence here.
- Re-scans create **new** leads only and never overwrite owner-reviewed cases.
- Source URLs are stripped of query strings and fragments before syncing.
- A strong title or book match creates a candidate requiring owner confirmation, not “verified you.”
- Other-person/name-twin material is excluded from a user's verified vault, not erased from external websites.
- Negative press, factual criticism and lawful public records are not automatically violations or takedown targets.
- All legal notices and platform reports require human authorization and legally supported grounds.

## Local verification

```bash
python3 -m unittest discover -s app-factory/sites/handling-life/identity-defense -p 'test_*.py' -v
python3 app-factory/sites/handling-life/identity-defense/worker.py
```

The second command uses only fictional offline fixtures. To scan public RSS, run `worker.py --scan`; private Airtable writes require all three secrets.

**Next acceptance gate:** securely import the full v0.2 dashboard source, deploy authentication and encrypted private persistence, connect the Actions secrets, run an authorized real sync, and verify every existing CI gate before merging to `main`.

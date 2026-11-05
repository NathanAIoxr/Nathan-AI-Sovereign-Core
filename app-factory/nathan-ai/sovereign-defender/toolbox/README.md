# NATHAN AI — SOVEREIGN DEFENSE / DEHACK TOOLBOX

Source-preserving extension of the existing Sovereign Defender and Dehack the World / Deliver the World modules. Built 2026-11-05. No original source modules or creator wording are replaced.

## Working owner-local tools

1. Offline URL-structure review: warns about HTTP, embedded credentials, IP addresses, punycode, unusual ports and long URLs. It does not visit the target or verify a site's reputation.
2. Consent/permissions worksheet: checks owner-entered permission requests and surfaces missing justification, broad sensitive access and administrator privileges. It cannot inspect, change or revoke operating-system permissions.
3. Ransomware resilience checklist: evaluates stated copy counts, media separation, offline/immutable storage, offsite copies, prior restore tests, versioning and key recovery. Self-reporting is not independent restoration proof.
4. File fingerprint: WebCrypto SHA-256 of one explicitly selected local file up to 12 MiB, with optional comparison to an earlier fingerprint. It does not execute, quarantine, alter or classify file content as safe.
5. Incident timeline: up to 100 manually entered timestamped events in browser memory, exportable as JSON. Events are not authenticated, sent to authorities, or digitally signed.

Existing working tools stay in their original paths:
- ../ : Sovereign Defender, original-file triage, passive comparison, inert ransomware simulation.
- ../../dehack-deliver/ : 104 original A–Z names (not 104 implemented specialized tools), creator-attributed three review filters, original document comparison, evidence review, reversible arithmetic, source import.
- ../../../one/sovereign-acro-matrix/ : REALITIST / MIDA / DATA⇄ATAD.
- ../../../one/hall-of-mirrors/ : original classifier.
- ../../five-guardians/ and ../../../one/offloader/ : original guardians and ONE backup modules.

## Operational boundaries

- Local browser processing. No remote reputation requests, malware execution, active scans, data broker removal, retaliation, system administration or credential collection.
- Never paste secrets or private keys into worksheets. No incident notes or file bytes are sent by this app's JavaScript; the public host still receives ordinary page requests.
- Source file integrity fingerprints validate observed bytes, not factual truth, safety or provenance of the original baseline.
- Real security requires maintained endpoint defenses, trusted patching, separate offline/immutable backups and actual clean-system recovery tests.
- The original Hack D Hack/Glyphstream and GUARDRAILAI historic source entries are separately marked as requiring verified source recovery.

## Testing

Run from repository root:

    node --test app-factory/nathan-ai/sovereign-defender/toolbox/engine.test.cjs

Serve the repository with a trusted local static server and visit the toolbox folder. Export only records you intend to keep.

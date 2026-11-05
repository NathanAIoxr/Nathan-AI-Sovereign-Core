# THE NATHAN TABOR HALL OF MIRRORS — recovered original prototype

**Original preservation:** This engine, its browser page, and its tests were copied unchanged from the historical Git branch `feat/hall-mirrors-duodecimal-20261022` into the current ONE source tree on November 5, 2026. The branch remains available as original provenance.

[Open the browser demonstration](./index.html) · [View engine](./engine.js) · [View tests](./engine.test.cjs) · [Original branch](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/feat/hall-mirrors-duodecimal-20261022/app-factory/one/hall-of-mirrors)

## Job: passive threat interpretation and original-preserving mirror views

The existing code provides:

- **5,000,000 lazy logical mirror identifiers**, not deployed IP addresses, proxies or honeypots.
- **101 author-defined source tokens** with decimal, base-12 and Dewey-style identifiers. The indexes are not official Dewey classifications.
- Forward, backward and upside-down **presentation views**. This is not encryption, anonymity or an authentication mechanism.
- A small **inert suspicious-command classifier** reporting patterns such as destructive shell commands and remote-script piping. Its output is a recommendation and **never creates a quarantine, firewall rule, remote action or counterstrike**.
- SHA-256 fingerprints for comparing the preserved registry and input text.

**Status:** Source recovered and unit tested in CI, but **not** a completed antivirus, security enforcement service or production threat detector. The demonstrations are not a substitute for a real malware scanner or defensive incident-response team.

## Owner-selected passive source inspection (new adapter)

The additional `inspector.cjs` is a separate **read-only, offline** adapter. It uses the unchanged original Hall of Mirrors `classify` rules against owner-selected local text files, hashes each eligible file with SHA-256, and emits a metadata-only JSON report with pattern flags. It never runs content, scans a network, follows symbolic links, modifies originals, quarantines files, or retaliates. No-match does **not** mean malware-free; a reported match is a heuristic for human review, not proof of an infection.

    node app-factory/one/hall-of-mirrors/inspector.cjs --dir /absolute/owner/selected/folder > /private/inspection-report.json

Use only a directory you own and administer. Review the report privately: filenames and digests may disclose sensitive information. Defaults are bounded to 512 entries, 5 directory levels, 256 KiB per file and 8 MiB total read. The original code and its 101 names remain untouched.

## Test

    node --test app-factory/one/hall-of-mirrors/engine.test.cjs

## Completion gates

1. Original source: historical branch linked and preserved.
2. Build: pure browser/Node module; load in a browser and run the Node test command.
3. Tests: run and record CI result for this exact commit.
4. Security: human-review the simple rules; verify no remote operations, safe output handling and no claim of cryptographic protection.
5. Release: verify live GitHub Pages and a reproducible offline installation. **Not yet fully evidenced.**

Any subsequent improvements should be made in separate commits rather than silently replacing the original recovered source.

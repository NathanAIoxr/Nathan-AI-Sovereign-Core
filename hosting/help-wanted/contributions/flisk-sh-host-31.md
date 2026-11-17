# flisk-sh/host #31 — MIT package metadata handoff

Prepared by Nathan Tabor and Nathan AI, 2026-11-16.

- Request: https://github.com/flisk-sh/host/issues/31
- Base commit: `82218f8baf2c30c58e3654b94bc3446a33830e64`
- Source file: `package.json` blob `33374203b9951c416170439f87766b7a24373237`
- License: `LICENSE` blob `88dacd0b0701583089f917e958d55c9a09d7002b`, MIT.
- Request asks to make npm package metadata match the repository MIT license. The issue was returned by GitHub search; its state/assignees were not exposed in that result, so open/unassigned status remains unverified.
- `CONTRIBUTING.md` was not found at repository root. Review any additional repository instructions before upstream submission.
- No upstream submission performed.

## Patch (one-line metadata change)

```diff
diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -1 +1 @@
-{ "name": "host", "private": true, "type": "module", "description": "host.flisk.si: where to run your own agent pods for free.", "scripts": { "test": "bun test", "dev": "bun scripts/dev.mjs" } }
+{ "name": "host", "private": true, "type": "module", "license": "MIT", "description": "host.flisk.si: where to run your own agent pods for free.", "scripts": { "test": "bun test", "dev": "bun scripts/dev.mjs" } }
```

## Evidence and gates

- PASS (Python local check): original JSON parsed; `license` absent; modified JSON parsed; `license == "MIT"`; scripts unchanged.
- PASS (source inspection): upstream `LICENSE` begins with `MIT License`.
- NOT RUN: `bun test` (Bun unavailable in execution environment). No upstream code was executed.
- NOT RUN: `git apply --check` in a checkout of the pinned upstream commit.
- NOT VERIFIED: issue current open/assignment status, existing upstream PRs, and any further contribution policy. The search for upstream PRs did not reliably distinguish issues from PRs.

## Status

Prepared: yes. Verified: static checks only. Delivered upstream: no. Merged: no.

Next: verify current issue and PR status, apply patch against pinned checkout, run `bun test` in isolated environment, then prepare maintainer-facing handoff. Do not claim completion until those gates pass.

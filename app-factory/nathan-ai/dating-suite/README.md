# Dating & Relationship Apps by Nathan Tabor

| App | Cloudflare site | Source and scope |
| --- | --- | --- |
| TA🪭DA🎉 — Taters & Daters | [Open](https://ta-da-taters-daters.nathantaboract.workers.dev/) | [Original MIT export](ta-da/dist/) preserved with its browser assets, license and test suite. |
| Relationship Intent Clarifier · Act AI | [Open](https://relationship-intent-clarifier.nathantaboract.workers.dev/) | [Browser reconstruction](relationship-intent/) of sample matchmaking intent and conversation rules. |
| BUDDY AI 🌀 — THE iCU ❤️ APP | [Open](https://icu-buddy.nathantaboract.workers.dev/) | [Browser reconstruction](icu-buddy/) of the local, editable drafting companion. |

Each preview has a distinct Worker and its own website address. The original Taters & Daters ChatGPT Site is the provenance source. This directory backs the three entries in the ONE Hub app catalog and carries the per-app build backlog in [projects.json](projects.json).

## Build and verify

From this directory run `node --test check.test.mjs` and `node build.mjs /tmp/dating-sites`. Each output is a self-contained Cloudflare module. The original checks also run with `cd ta-da && node check.cjs`. GitHub Actions checks the original and rebuilt app behavior and produces the three Worker upload artifacts. Each site exposes a `/healthz` receipt with its app ID, Worker name, release fingerprint and asset count.

All three previews use sample information. Profile matching and planning remain local to the TA DA demo. Act AI evaluates sample scenarios, and iCU Buddy uses editable local templates. Proposed work on real accounts, shared messages, and native releases is tracked separately.

# BOOBIES by Nathan Tabor

[Poster gallery](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/index.html) · [Release directory](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/index.html) · [Creator's source](public/source.md) · [Poster artwork](public/artwork)

| Release | What it does | Source |
| --- | --- | --- |
| [App](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/app/index.html) | Seven-segment calculator with 180° rotation and both original examples | [App source](releases/app/) |
| [Game](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/game/index.html) | Six playable SNOT flip puzzles with scoring and reset | [Game source](releases/game/) |
| [OS](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/os/index.html) | Browser desktop with a calculator, simulated SNOT log, and local notes | [OS source](releases/os/) |
| [SoS](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/sos/index.html) | Release directory with live response and page-title checks | [SoS source](releases/sos/) |
| [AGI](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/agi/index.html) | Planning prototype that generates a local checklist | [AGI source](releases/agi/) |
| [AI](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/ai/index.html) | Local example-based request classifier | [AI source](releases/ai/) |
| [SI](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/si/index.html) | Two-way calculator pattern conversion | [SI source](releases/si/) |
| [EI](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/ei/index.html) | Local phrase-level message review | [EI source](releases/ei/) |
| [AE](https://pub-281f12694638401cb7a5f34b42104be0.r2.dev/releases/ae/index.html) | Ordered local text transformations and per-step results | [AE source](releases/ae/) |

The [public bundle](public/) contains the exact HTML served by the dedicated Cloudflare R2 bucket and four full-dimension WebP posters. All nine release pages run their product features in the browser. The SoS status button makes same-origin requests to check live endpoints.

Run `node releases/build.mjs public` from this directory to rebuild every release and the directory. To rebuild only one release, append its ID, for example `node releases/build.mjs public game`. Run `python -m http.server 8000 --directory public` and open `http://localhost:8000/` to try the site. To publish a release, upload its generated HTML to the matching `releases/<id>/index.html` path.

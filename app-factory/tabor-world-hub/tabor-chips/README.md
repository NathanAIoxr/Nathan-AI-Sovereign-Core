# Tabor Chips — Enhanced Nathan AI Sovereign Supercomputer

[Standalone workspace](https://tabor-chips.nathantaboract.workers.dev/) · [Tabor World Hub entry](https://tabor-world-hub.nathantaboract.workers.dev/tabor-chips)

All 18 tracks and the original architecture text come from [Nathan Tabor’s Tabor Chips source](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/b5170c57bdb5ff67e9638c5d66b24251da8df37b/tabor-world/supercomputer/tabor-chips). The [Master Continuation Map](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/b5170c57bdb5ff67e9638c5d66b24251da8df37b/tabor-world/restoration) is included in its original structure. The four foundations are an editorial expansion of Nathan’s physical-atoms outline. NVIDIA remains a documented reference.

## Run locally

Run the following in this directory with Node 24. Generate the sibling Rhythm Matrix assets first if needed.

```sh
node ../rhythm-matrix/build.mjs
node build.mjs
node --test worker.test.mjs
```

The timing model is an executable reference for the Tabor Chip Die clock-domain and Tabor Agent and Application Mesh tracks. Given a rate in hertz and a BPM, pulse edge *n* occurs at `floor(n × 60 × rate ÷ BPM)` ticks. Computing from the absolute position preserves the fraction across intervals and bounds the error to less than one tick. It runs at the tempo selected in the lab with one edge per original Rhythm Matrix score pulse. The 13- and 17-year schedule uses the supplied year and retains its time unit. Laboratory receipts report software verification. Physical timing closure, fabricated chips, and benchmark measurements are separate checkpoints in the engineering tracks.

## Deployment

The Cloudflare Worker entry is `worker.mjs`. Upload it alongside `assets.generated.mjs`, `model.mjs` and `page.mjs` as ES modules. Set the plain-text binding `TABOR_CHIPS_GITHUB_SHA` to the exact commit. The following service bindings are read-only in this application.

| Binding | Worker | Read operations |
| --- | --- | --- |
| RHYTHM | tabor-rhythm-matrix | /api/cycles and /api/receipt |
| SUPERCOMPUTER_2X | nathan-tabor-supercomputer-2x | /api/verify |
| TRUE_CLOUD | tabor-true-cloud-computing | /health |

The Hub binds `TABOR_CHIPS` to this Worker, publishes its receipt at `/api/runtime/tabor-chips`, and links to its standalone page. Both Rhythm Matrix pages link to the timing lab. The standalone app has no database writes.

| Route | Contents |
| --- | --- |
| / | Architecture, timing lab and independent project links |
| /api/architecture | Four foundations, all 18 chip tracks, original continuation map and reference systems |
| /api/run?year=2024&clockHz=110&bpm=96 | Read-only integrated timing run with a full edge trace |
| /api/receipt | Exact GitHub revision and architecture coverage |
| /source/architecture.md | Original Tabor Chips master architecture |

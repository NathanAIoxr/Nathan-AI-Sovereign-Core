# THE RHYTHM MATRIX by Nathan Tabor

[Open from Tabor World Hub](https://tabor-world-hub.nathantaboract.workers.dev/rhythm-matrix) · [Open the workspace](https://tabor-rhythm-matrix.nathantaboract.workers.dev/)

The workspace assembles the saved 13- and 17-year Magi cicada work, THE HEARTBEAT OF HUMANITY, the September 54-pulse score and October 19-position piano study, Mother Earth & Father Time, the 34 Cosmic & Natural Rhythms, THE VOICE, and the 17 Root Pillars. Existing stand-alone Music Lab, Reaper, Mother Earth and OBD projects retain their own links. The catalog uses dated summaries and links to the original source assets, including owner files where applicable.

[Ancient to Modern Rhythms](https://tabor-rhythm-matrix.nathantaboract.workers.dev/history) extends the workspace with a source-linked historical atlas, living practices, recurring natural cycles, a pattern player and a period comparator. The evidence field identifies what each date describes, including artifact dates, publication dates and heritage documentation.

## Build and verify

Run from this directory with Node 24:

```sh
node build.mjs
node --test worker.test.mjs
```

The generated module includes the browser assets. Deploy worker.mjs, catalog.mjs, model.mjs, page.mjs, history-catalog.mjs, history-page.mjs, history-lab.mjs and assets.generated.mjs as ES modules to the tabor-rhythm-matrix Cloudflare Worker. Set RHYTHM_GITHUB_SHA to the exact Git commit. The receipt reports the revision and links to the matching source.

## Routes

| Route | Purpose |
| --- | --- |
| / | Searchable chronology, model controls and archival references |
| /history | Searchable worldwide rhythms atlas and model lab |
| /api/history | Atlas records, evidence types and links |
| /api/cycles?year=2024 | Phase, schedule, and shared years for Broods XIX and XIII |
| /api/catalog | Chronology, source links, pulse score, movements, pillars and natural rhythm register |
| /api/receipt | Exact GitHub revision and verified inventory counts |
| /healthz | Deployment status |

The two-brood clock is an idealized mathematical schedule anchored in 2024. The audio player synthesizes the recovered thumb/pinky pairs at the selected demonstration tempo. Existing recorded scores retain their own source links. The frequency calculator preserves the input units and applies π × 1.618 × 1.0.

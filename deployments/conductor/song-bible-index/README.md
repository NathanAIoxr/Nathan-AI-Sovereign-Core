# Tabor Song & KJV Index

[Search the catalog](https://tabor-song-bible-index.nathantaboract.workers.dev/) · [Cloudflare health](https://tabor-song-bible-index.nathantaboract.workers.dev/api/health) · [Nathan AI Conductor handoff](https://tabor-song-bible-index.nathantaboract.workers.dev/api/handoff)

A versioned recording catalog for dirty blues, hokum, other adult-themed music, and songs with documented KJV connections. Recording and release years are labeled separately. The catalog holds public music metadata, short editorial notes, and source links.

| Connection | Evidence |
| --- | --- |
| Scripture set to music | A score, label, or verified text identifies the passage used as song text. |
| Biblical retelling | The musical work recounts a recognizable scriptural episode. |
| Biblical allusion | Specific language, characters, or images point to a KJV passage. |
| Thematic comparison | The passage and the music share a documented theme. The pairing is an editorial comparison. |

The source index and SQL schema are in `seed.json` and `schema.sql`. The Conductor's research queue is in `handoff.json`.

## Publish new entries

1. Open the recording and passage sources, record the evidence, and deduplicate by performance.
2. Add the proposed records to `seed.json`. Use a null year with `unknown` where the specific date still needs a source.
3. Run `node --test deployments/conductor/song-bible-index/catalog.test.mjs` using Node 24.
4. Run `node deployments/conductor/song-bible-index/publish.mjs` with the authorized `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables. The same seed can be reapplied without duplicating rows. The import adds or updates records by ID.
5. Check the live health and recording search. Count a work, performance and KJV link separately.

GET `/api/recordings` accepts `q`, `relationship` and `page`. Search matches artist, title, genre, theme and linked KJV reference. Relationship values are `text_setting`, `retelling`, `allusion`, and `thematic_parallel`. GET `/api/handoff` reads this project's handoff receipt from the existing Conductor ledger.

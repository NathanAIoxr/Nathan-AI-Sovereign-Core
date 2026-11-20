# Tabor Academy Card Games Library

[Open the library](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/card-games/) · [Live catalog counts](https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/card-games/api/health)

The library covers traditional, invented, proprietary, trading, historical, and solitaire card games. Search by title, alias, rules status, and game family. Each in-library guide has setup, turn order, scoring, and a teaching exercise. Browser activities include ten practice modes or games. Scores in the running scorecard are stored on the learner’s device.

Nathan Tabor’s first lesson starts before dealing: “You gotta make sure you’re comfortable cause you can’t sit there and not be comfortable cause then you can’t think right.” The teaching sequence goes from handling the deck and taking turns through mental arithmetic, the running tally from Gin Rummy at his granddad’s table, suit tracking, probability and Hi-Lo practice.

## Sources and editions

| Catalog status | Meaning |
| --- | --- |
| Documented edition | An in-library, independently written guide to a sourced game |
| Historical reconstruction | A named historical source or scholarly reconstruction with its classroom adaptations disclosed |
| Academy edition | A teaching variant, game or drill introduced in this collection |
| Linked reference | A sourced title or named variant with a reference link. Its rulebook or browser implementation can be added in a later release |
| Unresolved history | Evidence and open questions about a historical game, with no rules filled in as historical fact |

The first release includes 2,321 catalog records, 24 in-library rulebooks, 10 browser activities, and 10 lessons. A catalog record can describe a specific edition or variant. The archive is open-ended as more references and house rules are found.

- [Pagat alphabetical index](https://www.pagat.com/alpha/), [invented games](https://www.pagat.com/invented/), [commercial games](https://www.pagat.com/com/), [trading games](https://www.pagat.com/com/trading.html), and [solitaire](https://www.pagat.com/solitaire/card.html) contribute factual metadata and source links. See [Pagat’s policy](https://www.pagat.com/policy.html).
- [David Parlett’s historic card games](https://www.parlettgames.uk/histocs/) and [Andrew Lo’s Game of Leaves study](https://doi.org/10.1017/S0041977X00008466) inform historical records. The history of the Game of Leaves has its own unresolved entry, while Leaf Table is a new Academy game with its own record.
- [Foster’s Complete Hoyle](https://www.gutenberg.org/ebooks/53881) and [The American Hoyle](https://www.loc.gov/item/05024785/) are historical rulebook sources available in the U.S. public domain.
- [Stanford DREME family card games](https://familymath.stanford.edu/app/uploads/2022/11/DREME-All-Card-Games.pdf) and [Hi-Lo rank values and true count](https://wizardofodds.com/games/blackjack/card-counting/high-low/) provide additional teaching references.

## Local workflow

Use Node.js 24. Run `npm test`. Tests build the generated asset module, apply the seed against SQLite, and exercise search, the public routes and scoring logic.

Use `node scripts/export-seed.mjs` for SQL or pass `--summary` for counts. The snapshot files can be rebuilt with `scripts/import-pagat.py` and `scripts/import-supplement.py`, using Python with `lxml` and locally saved HTML pages from the sources above. Scraped HTML stays outside the Git checkout. See the input filenames in the scripts. Source-linked entries retain stable IDs. Add rules and lessons to `data/editions.json`, `data/recovery.json` and `data/lessons.json`. Record sources and preserve prior provenance when upgrading a linked entry.

## Deploy and verify

Production uses D1 and the existing Academy dispatch Worker. `cloudflare.json` names the dedicated card database, binding and public route. `npm run deploy` seeds the tables, mounts the route in the current dispatch entrypoint, and checks the binding and deployed module set. Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the deployment environment. The deploy uses the Cloudflare API like the Academy institution workflow.

Run `npm run verify` against production. The read API exposes `api/health`, `api/games`, `api/games/:id` and `api/lessons` relative to the public route. Game listing accepts `q`, `family`, `status`, `play=1`, `limit` and `offset`. It serves public catalog data only. The lesson and practice pages require no learner account.

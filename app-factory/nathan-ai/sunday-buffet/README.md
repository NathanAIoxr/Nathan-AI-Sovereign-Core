# Sunday Buffet Slam-Down

A standalone Nathan Tabor project with a Cloudflare site, four-decision browser game, installable web app, and a short book in web and print editions.

| Entrance | What you can do |
| --- | --- |
| [Website](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/sunday-buffet/) | Open the public edition |
| [Game](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/sunday-buffet/game) | Make the ranch, cornbread, table-turnover and tip decisions |
| [App](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/sunday-buffet/app) | Stack two plates each, edit portions, calculate tips and install on a supported browser |
| [Book](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/sunday-buffet/book) | Read the seven chapters and source notes or download the PDF |
| [Edition receipt](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/sunday-buffet/api/edition) | Verify the public manuscript's version and SHA-256 in Cloudflare D1 |

The preacher and his wife are fictional. Portion calories are scenario assumptions. The first spread totals 2,415 and 2,120 calories respectively. A separate tall-tale preset models an even 4,000 calories for the preacher. The book links source interviews and the U.S. Department of Labor's tip-credit guidance. The installed web app caches the book, game and calculator. Choices and portions live in browser storage.

## Build and test

From this folder, using Node 22 or later:

```sh
node scripts/bundle.mjs
node --test tests/*.test.mjs
```

The reader and PDF are generated from [BOOK.md](BOOK.md). To regenerate them, use Python with ReportLab and the Liberation font set (optionally set `LIBERATION_FONT_DIR` to its directory), then run `python scripts/make_book.py`. The app icons use Pillow and `python scripts/make_icons.py`. Run the Node build again after editing assets. GitHub Actions builds and tests the Worker. To deploy with Cloudflare credentials, run `npx wrangler deploy --dispatch-namespace nathan-tabor-platforms` from this folder. The production gateway mounts the project at `/tabor-apps/sunday-buffet/`. The D1 migration creates the edition table. For a new edition, update the app version and Worker lookup, then add a row with the exact manuscript and its SHA-256.

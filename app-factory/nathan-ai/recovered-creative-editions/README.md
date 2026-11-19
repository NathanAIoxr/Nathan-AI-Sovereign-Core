# Nathan Tabor’s recovered creative editions

Each edition sits in a sibling folder and has its own Worker, home page, playable game, and downloadable Markdown reader. The readers are new editorial editions from recovered source descriptions. Catalog applications carry 101 dragon, 101 unicorn, and 404 Liberation Codex records.

- [Heka](../heka/app.json) · [Live site](https://tabor-heka.nathantaboract.workers.dev)
- [Dragons](../dragons/app.json) · [Live site](https://tabor-dragons.nathantaboract.workers.dev)
- [Unicorns](../unicorns/app.json) · [Live site](https://tabor-unicorns.nathantaboract.workers.dev)
- [Castles & Unicorns](../castles-unicorns/app.json) · [Live site](https://tabor-castles-unicorns.nathantaboract.workers.dev)
- [Liberation Codex](../liberation-codex/app.json) · [Live site](https://tabor-liberation-codex.nathantaboract.workers.dev)
- [Manifestation](../manifestation/app.json) · [Live site](https://tabor-manifestation.nathantaboract.workers.dev)
- [Magic](../magic/app.json) · [Live site](https://tabor-magic.nathantaboract.workers.dev)
- [Cigam](../cigam/app.json) · [Live site](https://tabor-cigam.nathantaboract.workers.dev)
- [Voodoo, Vodou & Hoodoo](../voodoo/app.json) · [Live site](https://tabor-voodoo.nathantaboract.workers.dev)
- [GOODOO⁷ + JOODOO](../goodoo-joodoo/app.json) · [Live site](https://tabor-goodoo-joodoo.nathantaboract.workers.dev)

### Run checks

```sh
node --test app-factory/nathan-ai/recovered-creative-editions/editions.test.mjs
```

### Deploy an edition

Deploy the folder’s `worker.mjs` as a Cloudflare ES module Worker using the name in its `app.json`. The module is self-contained and requires no external bindings. Enable the Worker’s workers.dev route, then check `/healthz`, `/books`, and `/game`.

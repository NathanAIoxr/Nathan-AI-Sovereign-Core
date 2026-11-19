# TaborPoolBoys

Edited by Collyn Tabor and Nathan Tabor. This is the separate crossover magazine for TABORBOY and TABORPOOL. The magazine has five issues, an installable browser reader and the Match the Covers game.

- [Website](https://pub-2df43f63514844ecbcd9f7da4de75d89.r2.dev/index.html)
- [Reader](https://pub-2df43f63514844ecbcd9f7da4de75d89.r2.dev/magazine/index.html)
- [Game](https://pub-2df43f63514844ecbcd9f7da4de75d89.r2.dev/magazine/play.html)

Run `npm test` and `npm run build`. The public R2 deployment is the contents of `build/site/`. The Cloudflare Pages quota was at capacity for this account, so this project uses its own R2 bucket. The R2 bucket holds public assets and rendered site files only. Its GitHub workflow builds an independent artifact and runs a scheduled live catalog check.

The separately deployed `taborpoolboys-worker` in the `nathan-tabor-platforms` namespace verifies the public files and SHA-256 cover checksums on Pocket Control’s hourly schedule.

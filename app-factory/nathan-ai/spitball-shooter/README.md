# Spitball Shooter

A standalone classroom arcade gallery by Nathan Tabor. [Play on Cloudflare](https://pub-a1faa1c97cd44a5a922a1fe338efbde7.r2.dev/index.html).

Tap or drag over the gallery to aim. Hold Fire and release in the highlighted breath window. From the keyboard, use the arrow keys, hold and release Space to shoot, and press D to duck. The teacher warns before turning around. Releasing a shot while the teacher is looking sends you to detention, where you can retry the round from the last saved score.

1. **The Back Row** introduces stationary targets, standard wet paper and the bendy straw.
2. **Passing Notes** adds moving paper footballs, a desk fan, heavy cardboard and the jumbo straw.
3. **The Chalkboard Gauntlet** unlocks foil and the protractor sight. The angled ruler sits to the right of the bank ring.
4. **Last Bell** unlocks eraser and clay plus the double-barrel attachment. Use a wide straw to defeat three armored targets.

Bonus props trigger the coffee spill, chalk cover, map and globe, projector, and cardboard cheek bullseye. The teacher patrols the gallery and calls detention. Classroom settings and the best completed-round score are kept in browser storage.

Open `index.html` locally for offline play. To republish to the dedicated Cloudflare R2 bucket, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` with R2 write permission, then run `node deploy.mjs` from this directory. This is a manual deploy from the checked-out source. Run `node --test game.test.mjs` before publishing.

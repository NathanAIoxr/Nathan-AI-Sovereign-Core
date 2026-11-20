# SMACK THAT ASS (AUTHORITARIAN SATANIC SOULS)

Choose a fictional figure from the Catholic hierarchy or the Christian hierarchy. The roles are grouped by church tradition. The KJV dedication quotes the words ass and asses, links Revelation 22:18–19, and attributes the warning about damnation to a published sermon. Choose **Hand** or **Face** and tap the illustration or press Space. Only the player can strike. The app links to the Ryan Report and Scottish Child Abuse Inquiry records under **Historical record**.

[Open the app](https://pub-a374b836528943e2917457f04363c2ff.r2.dev/releases/smack-that-ass/index.html) · [Release health](https://pub-a374b836528943e2917457f04363c2ff.r2.dev/releases/smack-that-ass/health.json)

## Build and test

Run from this directory with Node.js 22 or later.

```sh
node --test worker.test.mjs
node build.mjs
```

The build creates `dist/site/` and prints the SHA-256 release digest of the three app assets. The same digest is recorded in `dist/site/health.json` and packaged in `dist/worker.mjs`.

## Cloudflare release

Upload `dist/site/` to the `releases/smack-that-ass/` prefix in the existing `nathan-tabor-game-app-stations` R2 bucket. Upload the stylesheet, script, and health receipt before the HTML entry. Check that the public responses match the built files and that the health receipt reports the local digest.

The build also packages a dedicated Worker module and its upload metadata for a future release on an account with Worker capacity.

[Cloudflare multipart upload documentation](https://developers.cloudflare.com/workers/configuration/multipart-upload-metadata/)

## Conductor

Use this directory and the existing `smack-that-ass` station manifest. Check the release digest, test role and target switching on a narrow touchscreen viewport, and publish and verify the generated station directory entry. Record the commit, test run, and live app and station URLs in the scoped app-station receipt.

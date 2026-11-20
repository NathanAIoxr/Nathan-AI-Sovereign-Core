# TAP THAT · ARCADE

Tap arcade by Nathan Tabor. Open `web/index.html` directly for a local browser preview.

The GitHub branch is `zone/tap-that-arcade`. Cloudflare holds this build in the `tap-that-arcade-holding` Workers for Platforms namespace. Its internal alias is `tap-that-arcade.test` and the D1 record and KV mode are `HOLDING`. The Queue is reserved for staging jobs. It has a producer binding and the game creates no jobs during play.

The browser source is in `web/`. The Worker serves the same three files from the private R2 `staging/web/` prefix. The identity marker is `staging/zone-app.json`. The separate D1 database contains a synthetic identity record. CDN routes, preview URLs and production hostnames are outside this holding deployment.

Run the checks from this directory with `node --test zone.test.mjs`. To reupload the same package with authorized Cloudflare access, apply the D1 migration, write the holding record, update the private R2 files and use `wrangler deploy --config wrangler.toml --dispatch-namespace tap-that-arcade-holding`.

## Public browser preview

[Open the standalone browser build](https://pub-3c32ee03d2dd4de48f670290cf37055d.r2.dev/index.html). Cloudflare serves only the three checked-in web assets from a separate public R2 preview bucket. The staged Worker, database, queue and private asset bucket remain separate. The public HTML, CSS and JavaScript were downloaded and matched against the source bytes at publication.

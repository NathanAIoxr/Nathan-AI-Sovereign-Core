# ONE-EYED GOD TV

Rotary television game by Nathan Tabor. Open `web/index.html` directly for a local browser preview.

The GitHub branch is `zone/one-eyed-god-tv`. Cloudflare holds this build in the `one-eyed-god-tv-holding` Workers for Platforms namespace. Its internal alias is `one-eyed-god-tv.test` and the D1 record and KV mode are `HOLDING`. The Queue is reserved for staging jobs. It has a producer binding and the game creates no jobs during play.

The browser source is in `web/`. The Worker serves the same three files from the private R2 `staging/web/` prefix. The identity marker is `staging/zone-app.json`. The separate D1 database contains a synthetic identity record. CDN routes, preview URLs and production hostnames are outside this holding deployment.

Run the checks from this directory with `node --test zone.test.mjs`. To reupload the same package with authorized Cloudflare access, apply the D1 migration, write the holding record, update the private R2 files and use `wrangler deploy --config wrangler.toml --dispatch-namespace one-eyed-god-tv-holding`.

## Public browser preview

[Open the standalone browser build](https://pub-55bd558b2d4947479cf4be2620e155ea.r2.dev/index.html). Cloudflare serves only the three checked-in web assets from a separate public R2 preview bucket. The staged Worker, database, queue and private asset bucket remain separate. The public HTML, CSS and JavaScript were downloaded and matched against the source bytes at publication.

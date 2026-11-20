# TAP THAT · COMMAND CENTER

Staging command console by Nathan Tabor. Open `web/index.html` directly for a local browser preview.

The GitHub branch is `zone/tap-that-command-center`. Cloudflare holds this build in the `tap-that-command-center-holding` Workers for Platforms namespace. Its internal alias is `tap-that-command-center.test` and the D1 record and KV mode are `HOLDING`. The Queue is reserved for staging jobs. It has a producer binding and the game creates no jobs during play.

The browser source is in `web/`. The Worker serves the same three files from the private R2 `staging/web/` prefix. The identity marker is `staging/zone-app.json`. The separate D1 database contains a synthetic identity record. CDN routes, preview URLs and production hostnames are outside this holding deployment.

Run the checks from this directory with `node --test zone.test.mjs`. To reupload the same package with authorized Cloudflare access, apply the D1 migration, write the holding record, update the private R2 files and use `wrangler deploy --config wrangler.toml --dispatch-namespace tap-that-command-center-holding`.

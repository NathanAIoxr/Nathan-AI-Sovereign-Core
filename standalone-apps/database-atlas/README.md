# Tabor Database Atlas

By Nathan Tabor and Nathan AI.

The Atlas publishes database import counts, public project reachability, and aggregate Help Wanted queue status. Dashboard visitors can open project links, refresh current data, and see when the latest monitoring run occurred. The site serves the same interface from static hosting and Cloudflare Workers.

- [Cloudflare Atlas](https://tabor-database-atlas.nathantaboract.workers.dev/)
- [Public status JSON](https://tabor-database-atlas.nathantaboract.workers.dev/api/status)

## Deployment

Apply `schema.sql` to `tabor-database-registry` after setting up the database registry. Upload `worker.mjs` as the Worker entrypoint. Attach `index.html`, `style.css`, and `app.js` as text modules with the matching file names. Bind `REGISTRY` to the database registry and `HIVE` to the Sovereign Hive.

Set the Worker Cron Trigger to `*/5 * * * *`. Worker Bee sends bounded HTTP checks to the listed public projects. Ant Bot checks that each verified registry entry has the expected number of matching source and D1 table counts. Each stores the latest result. The public API exposes a fixed list of snapshot titles, summary counts, and project status. Private data, connection details, issue text, and live database rows stay in their existing systems.

To host the static page elsewhere, publish `index.html`, `style.css`, and `app.js` together. The browser uses the same public Cloudflare status endpoint on all hosts.

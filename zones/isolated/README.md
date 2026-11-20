# Independent project holding zones

| Project | Placeholder hostname | Cloudflare dispatch namespace |
| --- | --- | --- |
| Website Core | `sovereign-website-core.test` | `sovereign-website-core-holding` |
| Book Series | `sovereign-book-series.test` | `sovereign-book-series-holding` |
| Apps | `sovereign-apps.test` | `sovereign-apps-holding` |
| Games | `sovereign-games.test` | `sovereign-games-holding` |

Each namespace contains one private holding Worker with its own D1 database, R2 bucket, KV namespace, queue and Durable Object namespace. The Worker recognizes only its placeholder hostname and only the internal health route. The placeholder is an internal alias. Cloudflare DNS registration and any public binding are separate launch actions.

Each database uses the shared zone schema and contains its own project record. KV has `launch-mode=HOLDING`. The private R2 bucket contains `staging/zone.json`, an identity marker for its zone. The central D1 `zone_sandboxes` table records one set of verified bindings per project. Project builds and seed data can be added to each staging environment as they become available.

Apply schema changes to the project database before deploying its Worker. Replace `<project-id>` with the existing ID from `../staging/projects.json`.

```sh
config="zones/isolated/<project-id>/wrangler.toml"
npx --yes wrangler@4.165.0 d1 migrations apply ZONE_DB --remote --config "$config"
npx --yes wrangler@4.165.0 deploy --config "$config" --dispatch-namespace "<project-id>-holding"
```

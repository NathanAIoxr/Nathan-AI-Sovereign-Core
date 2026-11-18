# Library of Tabor Wisdom Fleet

Each of the 101 Wisdom Catalog records has its own Cloudflare Worker.
The entry Workers expose three roles through a shared runtime:

- `POST /worker` runs the subject-specific evidence index or native calculator.
- `POST /bot` makes a study card with matched evidence and study questions.
- `POST /agent` runs the analysis workflow and reports its evidence and steps.

GET requests describe routes. Start at
[Wisdom Fleet](https://tabor-wisdom-fleet.nathantaboract.workers.dev/) or get the
[module list](https://tabor-wisdom-fleet.nathantaboract.workers.dev/v1/modules).
The shared runtime also exposes these roles at `/v1/modules/NNN/{mode}`.

```sh
curl -fsS https://tabor-wisdom-074.nathantaboract.workers.dev/worker \
  -H 'content-type: application/json' -d '{"data":{"limit":30}}'
curl -fsS https://tabor-wisdom-101.nathantaboract.workers.dev/agent \
  -H 'content-type: application/json' \
  -d '{"text":"What can I control?", "evidence":[{"text":"Identify the choice and any assumptions."}]}'
```

Provide a question or passage as `text`, up to twelve shorter `evidence`
items with optional `locator` strings, or `data` for a native calculator.
Passage indexes use explicit topic cues. They preserve supplied locators and
make no claim that caller-supplied evidence is authenticated. The fleet hosts
the rules for all 101 entries. Complete primary-text collections, translation
alignment, and specialized simulations require further datasets or code.

## Deployment and federation

`node deployment.mjs /tmp/wisdom-fleet` generates the release bundle and the
gateway plus 101 entry Worker upload descriptors. The account's existing
`tabor-worker-catalog-replicas` R2 bucket holds one copy of the full release at
`wisdom-fleet/tabor-federation-v1/{release SHA-256}/{slot ID}.json` for every
identity in `slots.json`, sourced from the live federation registry. The
`/v1/nodes/{slot}/receipt` endpoint checks the release hash and slot identity.
Use `/v1/nodes/{slot}/bundle` for the source bundle or
`/v1/nodes/{slot}/modules/{NNN}/{mode}` for execution using that slot's verified
module definitions. The slot routes run on the shared Cloudflare runtime.

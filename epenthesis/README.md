# Nathan Tabor Wordplay Matrix

The Python engine and Cloudflare Worker share all four axes, twelve nodes, both epenthesis rules, and the music and cadence inventory in `matrix.json`. Run `python3 build_epenthesis_matrix.py` to print the four demonstration results and generate `src/index.mjs`. Run `node check.mjs` to verify parity.

Cloudflare serves the interactive matrix at `/`, axis JSON at `/api/matrix?axis=M_axis&next=over`, and the cadence inventory at `/api/cadence`. The supplied root query with an `axis` also serves axis JSON. The engine applies spelling-based project rules. The routing analogy describes the wordplay model.

The repository workflow verifies the generated Worker. Manual release uses the configured Cloudflare API token and account ID secrets. Requests are stateless.

The existing production Worker is preserved under `live/`. It retains the root JSON contract, dashboard, custom word-pair API, and D1 aggregate metrics. The new interactive inventory is at `/explore`, with cadence JSON at `/api/cadence`. The workflow deploys the production source under `live/`.

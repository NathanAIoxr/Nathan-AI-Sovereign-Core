# Cloudflare application imports

The microfrontend router is an import of the MIT-licensed Cloudflare vertical microfrontend template at `1fa42412fd36fd4f265383493f3e548f66e39c5d`. It mounts a D1-backed import catalog and an existing API through Cloudflare service bindings. The catalog follows the Cloudflare D1 starter pattern and uses a dedicated database seeded with the verified import manifest.

- [Microfrontend portal](https://tabor-ext-045-microfrontends.nathantaboract.workers.dev/)
- [Catalog API through the service binding](https://tabor-ext-045-microfrontends.nathantaboract.workers.dev/catalog/api/workers)
- [Upstream microfrontend template](https://github.com/cloudflare/templates/tree/1fa42412fd36fd4f265383493f3e548f66e39c5d/microfrontend-template)
- [Upstream D1 starter](https://github.com/cloudflare/templates/tree/1fa42412fd36fd4f265383493f3e548f66e39c5d/d1-template)

Apply the catalog schema to the chosen database and supply that database ID in the Wrangler config. The checked-in ID is a placeholder. The public routes accept GET requests and only expose records seeded from the Worker import manifest.

# Existing ONE app assembly

This assembly starts at `e6fd7f47ef6118e6a2420403c4909fa982c08ef2` (November 14, 2026).
It restores existing implementations and connects them through the shared launcher.

## Source components

| Role | Existing implementation | Assembly |
| --- | --- | --- |
| Shared shell | `app-factory/shared/one-universal-v061.js` and CSS | Loaded by GODTABOR pages, without copying its implementation |
| Shared themes | `app-factory/nathan-ai/appearance/` | Existing validated palettes and preferences loaded by GODTABOR and System Atlas |
| Navigation | `app-factory/nathan-ai/launcher/` | Existing command palette; adds GOD, World Builder, Design Studio and System destinations |
| Source retrieval | `app-factory/nathan-ai/workspace.js` | Existing JSON catalog loader; shared by launcher |
| Design editor | `app-factory/one/design-studio/` | Restored byte-for-byte from `feature/one-system-design-studio-2026-10-31` at `814fb84a892251b1c4b9f34eb52a101a7ad802d5` |
| Catalog backend | `app-factory/one/catalog-api/` | Restored byte-for-byte from `feature/one-readonly-airtable-catalog-20261102` at `87c59ff00dcfca8acbeb4f762cd62b1a0784099c` |
| Local application server | `app-factory/nathan-ai/assistant/server.py` | Reused unchanged to serve the assembled frontend |
| Asset storage | `app-factory/vault.js` | Existing browser-local IndexedDB; linked, not migrated |
| Private encrypted backup | `app-factory/one/lean-cloud/` | Existing separate owner gateway; not started or reconfigured |

Original documents and app data have not been imported, replaced or published.
`assembly-sources.json` records restored file hashes and branch provenance.

## Run and review

From the checkout root:

```sh
python app-factory/nathan-ai/assistant/server.py --port 8002
```

Open `http://127.0.0.1:8002/app-factory/system/index.html` or
`http://127.0.0.1:8002/app-factory/sites/godtabor/god.html`.
Use **Look & feel** to change the existing shared appearance and **Search** to switch apps.
The restored Design Studio retains its separate original editor and settings format.
Its exported token JSON is not automatically interchangeable with Appearance Studio settings.

The catalog gateway remains a separate server-to-server service. Follow its existing
README for environment configuration and loopback startup. Browser access is deliberately
rejected by that existing implementation; never place its bearer token in frontend code.
No credentials were generated, read into the frontend or copied into the repository.

## Database connection

The existing shared appearance engine now connects through the new
[`ONE App Shell`](../app-shell/index.html). Its Node.js/SQLite backend stores each app's
manifest, field schema, appearance configuration and records. The frontend fetches those
records on app selection and persists theme changes through the authenticated API.

The shell supports registration of existing app entry points with configurable text,
number and boolean record fields. Original apps retain their own domain logic. Follow
[the backend setup](../app-shell/README.md) to run it locally. Static GitHub Pages displays
a clearly labeled read-only preview; it cannot execute the database server.

The recovered Airtable catalog adapter remains independently available and unchanged.
The new shell does not copy private Airtable records or connect external providers.

## Validation

```sh
node --test app-factory/one/catalog-api/server.test.cjs app-factory/one/design-studio/five-matrices.test.cjs app-factory/nathan-ai/appearance/engine.test.cjs app-factory/nathan-ai/launcher/engine.test.cjs app-factory/nathan-ai/workspace.test.cjs
```

51 targeted tests passed, including the new live HTTP/SQLite integration and existing Factory checks. Catalog tests use an injected upstream response; no live
credentialed backend roundtrip or production deployment is claimed.

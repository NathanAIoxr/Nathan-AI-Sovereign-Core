# ONE database-driven app shell

A shared frontend and SQLite backend for app registration, per-app themes, configurable fields and persisted records. Existing apps remain available through their original entry points. The shell reuses Nathan AI's existing Appearance Studio and its validated palettes.

## Start

Requires Node.js 24 or newer; no npm installation is needed.

```sh
# Keep the database outside this public checkout.
export ONE_SHELL_DATA_DIR=/absolute/private/path/one-shell
# Set ONE_SHELL_TOKEN to a private random secret of at least 32 characters.
# Generate one locally with: node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
node app-factory/app-shell/server.cjs
```

Open `http://127.0.0.1:8793/` and enter your owner token. The server binds only to loopback. A successful login creates an eight-hour HttpOnly, SameSite cookie. The frontend never persists the token. Restarting the server invalidates sessions, while SQLite retains themes, manifests and records.

The database is initialized once from `seed.json`. Existing stored apps are never overwritten by seed updates. Initial apps: GOD Universe, GODTABOR World Builder, ONE Library and ONE Design Studio. Select an app to fetch its records and apply its saved appearance; changing its theme persists that app's configuration to SQLite.

## Register another app

Choose **Register an app**. The JSON editor accepts:

```json
{
  "id": "my-app",
  "name": "My App",
  "description": "My shared workspace",
  "entry": "app-factory/nathan-ai/index.html",
  "appearance": {"skin": "midnight"},
  "fields": [
    {"key": "title", "label": "Title", "type": "text"},
    {"key": "amount", "label": "Amount", "type": "number"},
    {"key": "complete", "label": "Complete", "type": "boolean"}
  ]
}
```

Entry paths must reference an existing app HTML file. Fields are bounded and validated. Configure an app to change its name, entry, appearance or fields. Schema changes that would invalidate existing records are rejected. The generic workspace supports records; existing specialized game, commerce, AI or hardware logic continues in each app and requires its corresponding service adapter. A palette alone does not implement those domain services.

## API

All `/api` routes except login require an owner session. JSON is required for writes.

| Route | Methods | Purpose |
| --- | --- | --- |
| `/healthz` | GET | Server/database health |
| `/api/session` | POST, DELETE | Owner login/logout |
| `/api/bootstrap` | GET | Database app manifests and available shared palettes |
| `/api/apps` | POST | Register an app |
| `/api/apps/:app` | GET, PUT | Read/update database manifest and theme |
| `/api/apps/:app/records` | GET, POST | List/create app-specific records |
| `/api/apps/:app/records/:record` | PUT, DELETE | Edit/delete within that app |

Record lists return the latest 1,000 rows. The UI can search those loaded rows and export them with the app manifest. SQLite foreign keys preserve app association; updates and deletions include the app ID. This is a single-owner local backend, not a multi-tenant hosted identity service. Remote hosting needs HTTPS, a proper identity provider, tenant policies and operational backups. No external providers, private library data or payment systems are configured automatically.

## GitHub Pages

`index.html` also runs on static hosting as a read-only preview using public seed metadata. It clearly labels this mode and disables database writes. GitHub Pages does not execute Node or host SQLite. Run the included server for real database persistence. Original app pages and original Design Studio are linked from both modes.

## Test

```sh
node --test app-factory/app-shell/server.test.cjs
```

The integration test opens an actual HTTP server and temporary SQLite database. It tests login/logout, request origin/host validation, app registration, field validation, record isolation, CRUD, and data/theme persistence after a real server restart.

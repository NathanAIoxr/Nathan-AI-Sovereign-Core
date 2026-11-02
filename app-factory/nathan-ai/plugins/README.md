# Nathan AI · App & Plugin Hub

The hub is connected to Nathan AI's main navigation, hero, directory and Assistant. `inventory.json` captures the workflows visible to this chat on November 2, 2026. Installation/connection timestamps are unavailable, so it does not claim that every entry was installed that day.

## Inspected workflow inventory

| Plugin group | Workflows |
|---|---:|
| Life Sciences Databases | 44 |
| Life Sciences Literature | 3 |
| Zotero | 1 |
| Sales | 1 |
| Data Analytics | 21 |
| Cloud Environment | 1 |
| Cloud Environment Onboarding | 1 |
| Designly | 19 |
| Bitcoin Mining Troubleshooter | 1 |
| Hypawave | 1 |
| **Total** | **93** |

Workflow names and descriptions come from the cloud skill catalog. Full skill instructions, opaque installation IDs, credentials and account contents are not copied into the web app. Actual host tool names are recorded only where they are exposed; workflow visibility alone does not establish tool availability, local-service health, permissions or remote API access.

The snapshot records no callable Airtable, Finances, Notion, Google Drive, Google Sheets, Datadog or Trello account tools in the inspected session. This means **not exposed here**, not necessarily uninstalled elsewhere. GitHub read access through the selected checkout/HTTPS Git proxy and the chat's image-generation tool are separately labeled host capabilities.

## Use

Search workflows or filter by plugin group. Choose a workflow, describe a task and prepare the handoff. Nothing executes on selection or preparation. Copy the reviewed request into the host chat to invoke the available workflow and its instructions. Task text is checked for recognizable credential patterns before handoff preparation.

**Continue in Nathan AI Assistant** transfers the draft through same-origin sessionStorage. Only the workflow ID appears in the URL; the task is not placed in a query string. The assistant validates that ID against the inventory, reconstructs the request from the validated task, removes the session handoff, and displays the question for review. It does not auto-answer, run a plugin, or grant new permissions. The assistant can separately load all 93 workflow descriptions as capability context.

The static app and optional model adapter have no bridge into the host's MCP tools. The model's tool execution remains disabled. A handoff does not authorize messaging, file transfers, payments, selling, deployment, publication, account changes or access to unavailable data. Plugin-specific instructions apply when the workflow is actually invoked in its supported host.

Export downloads the capability snapshot only. Refreshing the page reloads that same snapshot, not the live host registry. Ask the chat to rescan when connections change. Account imports and cross-app synchronization remain separate workflows requiring actual supported tools and authorized access.

## Validation

Run `node --test app-factory/nathan-ai/plugins/engine.test.cjs`. CI covers complete inventory capture, stable workflow IDs, capability-state separation, source-attributed assistant context, handoff validation and malformed inventories. Chromium checks cover all-group filtering/pagination, reviewed handoffs, no automatic model/plugin requests, assistant-context loading, export, credential-pattern rejection and a 390px layout.

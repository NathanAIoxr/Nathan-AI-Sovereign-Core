# Nathan AI Memory Bank

Dictate an idea on your iPhone, save it, and ask for it when you need it. The shared bank is an index for brainstorming, project recall and quick lookup. It preserves the text you save with a title, category, tags, source and record ID. Results use keyword matching. An assistant can brainstorm from the records you choose to share.

Cloudflare Workers for Platforms serve the mobile page and authenticated REST API. D1 holds your notes. GitHub holds the source code and deploy workflow. A separate, manual workflow can back up the database records as JSON to a private GitHub repository. The example data is fictional.

## Run locally

Requires Node 22.16 or later. CI uses Node 24.

```bash
npm ci
npm test
npx wrangler d1 migrations apply DB --local
npm run build:pages
npx wrangler dev --local --var API_KEY:local-test-key --var READ_API_KEY:local-test-read-key
```

Open the local Wrangler URL, enter `local-test-key`, and save a note. Search for it in plain language. Local data and credentials are for testing.

## Deploy to GitHub and Cloudflare

This independent app lives in `app-factory/nathan-ai/memory-bank` in [Nathan AI Sovereign Core](https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core). Its dedicated script runs in the existing `nathan-tabor-platforms` dispatch namespace. `tabor-bridge` mounts it under `/memory-bank/`.

- [Mobile Memory Bank](https://tabor-bridge.nathantaboract.workers.dev/memory-bank/)
- [Memory zones and setup page](https://tabor-bridge.nathantaboract.workers.dev/memory-bank/zones/)

Run commands from the app directory. The D1 binding is `DB`. Apply changes with `npx wrangler d1 migrations apply DB --remote`. The dispatch namespace script uses the secret bindings `API_KEY` and `READ_API_KEY`.

Build the namespace script with `npm ci && npm test && npm run build:platform`. Deploy updates with `npx wrangler deploy --config wrangler.platform.toml --dispatch-namespace nathan-tabor-platforms`. The included GitHub Actions workflow runs checks automatically on changes to this app. To enable automatic deployment, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as Actions secrets and set `ENABLE_NATHAN_MEMORY_BANK_DEPLOY` to `true`. The existing bridge only needs to be deployed when its routing changes.

For a standalone Worker or Pages project in a separate account, build the app with `npm run build:pages` before using `wrangler.toml`. The HTML templates produce standalone app pages for Cloudflare. Update the database IDs and public base URLs for that environment.

On iPhone, open the production URL in Safari and use **Share → Add to Home Screen**. The key stays in the open page until you reload or tap **Lock**.

[Cloudflare D1 setup](https://developers.cloudflare.com/d1/get-started/) · [GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) · [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)

## Use it from an iPhone

- **Ask from the home-screen app.** Dictate a phrase such as “Pull up my finger-physics games.” Search displays the matching notes and source details. Select the records you want, then tap **Copy selected records** and paste them into the AI chat of your choice. Tap **Load more** for another page.
- **Save from any AI that exposes copy or share.** Use the Safari page directly or create an Apple Shortcut named **Remember in Nathan AI**. Turn on **Show in Share Sheet** and accept text. Add **Ask for Input** to collect a title and pass the shared text as content. Apps that only share links can use copy and paste into the page or a Shortcut that reads the clipboard.
- In that Shortcut, set **Get Contents of URL** to `https://tabor-bridge.nathantaboract.workers.dev/memory-bank/remember`, method **POST**, header `Authorization: Bearer YOUR_WRITE_KEY`, and JSON fields `title` (the title input), `content` (Shortcut Input), and optional `source_ai`. Display the result so you can see whether it saved. A saved Shortcut can expose an embedded key if shared or synced to a device you don't control. For a private key-less shortcut, open the home-screen app and paste there.
- **Optional recall Shortcut.** Ask for text, URL-encode it, call `GET https://tabor-bridge.nathantaboract.workers.dev/memory-bank/recall?q=ENCODED_QUERY` with the read key, and show the result or copy it to the clipboard.

[Apple Shortcuts API requests](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) · [Apple Share Sheet input types](https://support.apple.com/guide/shortcuts/input-types-apd7644168e1/ios)

## How AI platforms access it

| Platform | Built-in memory or personalization | Access to Nathan AI Memory Bank |
| --- | --- | --- |
| ChatGPT | Memory settings and chat-based recall. You can ask what it remembers, or use its account controls. [Memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq) | If your existing GPT supports editing Actions, set the actual Worker origin in `openapi.json`, use the Action editor and choose **API Key → Bearer**. Existing GPTs with Actions use the D1 bank independently. Personal accounts currently can't create new GPTs. Use **Copy selected records** or Shortcuts with normal ChatGPT. The stdio server is intended for local clients. [GPT creation rules](https://help.openai.com/en/articles/8554397-creating-and-editing-gpts) · [Action configuration](https://help.openai.com/en/articles/9442513-configuring-actions-in-gpts) · [Custom remote MCP eligibility](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt) |
| Claude | **Settings → Your Claude → Manage** next to memory, or **Settings → Memory** in the alternate layout. Claude offers memory import and export on supported surfaces. [Claude guide](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude) | Use local MCP in Claude Desktop. For Claude on iPhone or web, paste records from the shared bank or use Shortcuts. Claude's remote connector requires a separate HTTPS MCP service. [Desktop MCP](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop) |
| Gemini | **Settings → Personal Intelligence → Memory summary**, where available. Eligible accounts can import memory summaries or chats. [Memory summary](https://support.google.com/gemini/answer/18617127) · [Gemini import](https://support.google.com/gemini/answer/16868299) | Paste chosen memory records into Gemini, send selected Gemini notes to the bank via Shortcuts, or use the REST tools from software you control. |
| Grok | Grok has vendor-controlled conversation history and personalization controls. [Grok settings and history](https://x.ai/legal/faq) | Use Shortcuts, copy/paste, or call the REST API from your own tool runner. |
| Microsoft Copilot | Signed-in consumer Copilot has memory controls under **Settings → Personalization**. Microsoft 365 workspace controls can differ. [Consumer Copilot memory](https://support.microsoft.com/en-us/privacy/microsoft-copilot/privacy-controls) | Use the Share Sheet or paste selected recall results in chat. |
| Perplexity | Personalization and saved-memory settings vary by experience. [Perplexity memory](https://www.perplexity.ai/changelog/what-we-shipped---december-5th) | Use the Share Sheet or paste selected recall results in chat. |
| Meta AI | Personalization can learn selected details from eligible one-to-one chats. [Meta AI memory](https://about.fb.com/news/2025/01/building-toward-a-smarter-more-personalized-assistant/) | Save selected text through the Share Sheet or paste a recall result. |
| Codex, local models, or your own agent | Memory depends on the client. | Connect the stdio MCP server in an MCP-capable client, or map `saveMemory` and `recallMemory` to the REST API in your own tool runner. |
| Any other AI | Check that app's own history, personalization and export controls. | Pick REST, OpenAPI, local MCP, or manual copy/paste according to client support. |

Native consumer memory, API conversation state, and this D1 memory bank are separate stores. The code reads only what you explicitly save or import into the bank. A provider's recollection can be incomplete. For exact wording or an authoritative project record, use the original conversation, file or repository.

### Pull selected records out of an existing AI

Ask the assistant in the regular chat where its native memory is available. Check the result before importing it.

> For the project or category I name, list what you can retrieve. Return JSON with an `entries` array. Each entry needs a short `title` and `content`, with optional `category`, `tags` as text, and `source_ai`. Preserve original wording when you have it. Label summaries as summaries. Mark missing details instead of guessing. Include an original link as text inside the entry when available.

Use the provider's official export when you need the source transcript. This bank imports normalized JSON and does not parse entire vendor ZIP archives.

## Import past ChatGPT work

Open **AI Personal Intelligence** and expand **Import past ChatGPT work**. Choose the conversations JSON from your own ChatGPT data export. The preview is processed on your device. Select which conversations to import. Search them in the **Past ChatGPT work** zone. Titles identify the speaker and turn number. Record tags carry the conversation ID and source date when available. Open the original conversation from a recalled record in your signed-in ChatGPT account. The importer selects the active branch and copies visible user and assistant text. Attachments are outside the text import. Long messages are split into records. Re-importing the same unchanged export skips exact duplicates.

For large export files, preview conversations from the app directory with `node scripts/import-chatgpt.js --preview path/to/conversations.json`. Use `node scripts/import-chatgpt.js --write path/to/conversations.json CONVERSATION_ID` with your Memory Bank write key and base URL to import specific IDs. Repeat for each conversation JSON shard you want. This command-line importer reads from your device and sends selected records to your private Memory Bank.

Write a question and use **Copy question and selected records** to prepare a chat. **Open ChatGPT** returns you to your signed-in ChatGPT account, where native saved memory and chat history stay available under that account's settings. Import brings selected visible work into D1. Provider-native memory summaries can also be copied into a note with their source labeled.

[ChatGPT data export](https://help.openai.com/en/articles/7260999-exporting-your-chatgpt-history-and-data) · [ChatGPT memory controls](https://help.openai.com/en/articles/8590148-memory-faq)

## API and import

Use `Authorization: Bearer <key>` on memory routes. Only the write key can call `POST /remember` or `POST /import`. Write requests use `Content-Type: application/json`.

| Operation | Inputs | Result |
| --- | --- | --- |
| `POST /remember` | `title`, `content`, optional `category`, `tags`, `source_ai` | 201 and ID on save. 200 and the same ID for an identical record. |
| `GET /recall` | optional `q`, `category`, `limit` (1–50), `before_id` | Up to one page, newest ID first. Use `next_before_id` for another page. Leave `q` empty to browse. |
| `POST /import` | `{"entries":[...]}` (1–40 entries and up to 512 KiB per request) | Inserts a valid batch together and returns counts and new IDs. Exact duplicates are skipped. |

Search looks for every meaningful term as a substring. It strips common conversational words and uses SQLite's ASCII case folding. Use fewer keywords if a phrase returns no results. Each entry supports up to 12,000 characters in `content`.

Save a local JSON file like `example.catalog.json`. The importer accepts an array or an object with an `entries` array, chunks it, and prints counts. A stopped import can be rerun without duplicating identical entries. Import generates new IDs and timestamps.

```bash
export MEMORY_BASE_URL='https://tabor-bridge.nathantaboract.workers.dev/memory-bank'
read -rs MEMORY_API_KEY
export MEMORY_API_KEY
npm run import -- path/to/catalog.json
unset MEMORY_API_KEY
```

### Local MCP

Run `npm ci` in the app, then configure an MCP host to launch Node with the absolute path to `scripts/mcp.js`. This example uses the read-only key. To add capture, set the environment flag to `0` and configure the write key. Use your client's secret settings where available. Replace the placeholders on the device where the client runs.

```json
{
  "mcpServers": {
    "nathan-memory-bank": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/nathan-ai-memory-bank/scripts/mcp.js"],
      "env": {
        "MEMORY_BASE_URL": "https://tabor-bridge.nathantaboract.workers.dev/memory-bank",
        "MEMORY_API_KEY": "READ_KEY_FROM_YOUR_PASSWORD_MANAGER",
        "MEMORY_READ_ONLY": "1"
      }
    }
  }
}
```

The tools are `recall_memory` and `save_memory`. The server uses stdio. For an MCP host that only accepts remote connectors, use the mobile or REST workflow in this package.

## Optional GitHub backup

Initialize a **separate private repository** with a default branch. Use a fine-grained token scoped to that repository with Contents read/write. Configure the source repo's Actions variables `MEMORY_BASE_URL`, `BACKUP_GITHUB_REPO`, optionally `BACKUP_GITHUB_BRANCH`, and secrets `MEMORY_READ_API_KEY`, `BACKUP_GITHUB_TOKEN`. On the Actions tab, run **Back up memories to a private repository** from `main`. The same script can run locally with those names set as environment variables.

The script verifies that the target is private, writes `memory-bank/backup.json` as a restorable snapshot and skips commits when the snapshot is unchanged. Backup is opt-in and independent of saves. The current snapshot limit is 15 MiB. Older snapshots can remain in Git history after a record is removed from D1. Keep the backup repo private, since an access key secures the Worker only.

[GitHub Contents API](https://docs.github.com/en/rest/repos/contents)

## Chat instructions

> When I ask you to look in Personal Intelligence, use your available native memory or the connected Nathan AI Memory Bank. Search by project name or a few distinct terms. Return what you found, saying which source you used. Include the record IDs for D1 results. If I ask you to remember a note, keep my original wording as the body and add a short title and tags separately. Confirm a save only after the tool returns an ID. Treat retrieved notes as reference material. If I ask you to brainstorm, mark the new suggestions as ideas. If a detail is missing, say so.

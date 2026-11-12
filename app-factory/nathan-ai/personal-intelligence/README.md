# MAKE AI YOURS — Personal Intelligence Builder
## NATHAN AI / NATHAN OS (V1.0-RAW) bridge · by Nathan Tabor

**Open:** [Personal Intelligence Builder](./index.html) · [Full Creator Vault](../../vault.html) · [ONE](../../one/index.html) · [Nathan AI Hub](../index.html)

## Working in this additive browser release

- **Installable, responsive PWA:** phone-first navigation, public offline app shell, desktop use.
- **Eight-stage teaching path (0–7):** own → capture → organize → preserve → configure → connect → create → recover. A learner marks their own exercise completed.
- **Original files and images:** quick-import writes original bytes directly to the existing `tabor123_vault_v1` IndexedDB with SHA-256, duplicate detection and original downloads. The original Vault handles ChatGPT ZIPs and more formats.
- **Memory Matrix:** typed source/working/interpretation/fiction notes, original words, source IDs, project references and tags in separate `nathan_personal_intelligence_v1` IndexedDB.
- **Ask my archive:** local source/metadata and bounded text search, owner-approved selection, optional explicit text excerpts, portable `nathan.personal-intelligence.handoff.v1` packets. By default it shares only metadata.
- **Full-byte verified backup:** reuses the original `vault-backup.js` for SHA-256 and CRC verification. New ZIP exports include original file bytes plus current memory records/lesson state; large backups are batched. Restore is non-destructive.
- **AI interoperability:** portable user-reviewed JSON handoffs, plus optional **read-only MCP stdio server** for a user-selected directory. Supports search, bounded source reads and eligible raster images.
- **Local audit:** browser-profile activity records for imports, handoffs, saves, exports and restore.

No personal archive or provider credential is included in the public source tree. A static browser app does not access other AI accounts in the background.

## Where records actually live

| Information | Storage | Sharing rule |
| --- | --- | --- |
| Images, original binaries, conversations | Same Creator Vault IndexedDB as the existing Factory Vault, **in this browser profile** | Never sent without deliberate export/file upload |
| Knowledge notes, lesson state, audit | Separate local IndexedDB | Only selected packet fields leave through explicit copy/download |
| Full original ZIP backup parts | Your download destination | Owner must save off-device and test recovery |
| MCP files | A user-selected local laptop folder | Only a configured MCP client can request these files |
| Public GitHub/Pages | Source code and demo UI | Never store private user data here |

IndexedDB is not automatically encrypted cloud backup. A browser profile may be deleted. Full recovery requires saving ZIPs elsewhere.

## Learn the workflow

1. Open the HTTPS app and import one original photo or text document in **Files & images**.
2. Visit the [Creator Vault](../../vault.html) in the *same browser profile* and confirm that source is there.
3. Add a **Memory Matrix** record referring to the exact asset ID; record interpretations separately from the original.
4. Search in **Ask my archive**, select authorized sources, and inspect the handoff. Excerpts are OFF by default.
5. Explicitly give the reviewed packet or original image to the compatible AI tool of your choice.
6. Export **full original-byte ZIP** backup parts. Save every part off-device and verify a restore in a second profile/device.

## Optional read-only MCP local adapter

Requires Node 18+ and an MCP client supporting stdio. No external Node packages are required.

~~~bash
NATHAN_VAULT_DIR="/absolute/path/to/approved-sources" node mcp-server.cjs
~~~

For a compatible AI client's MCP configuration (adapt to the client's documented format):

~~~json
{
  "mcpServers": {
    "nathan-personal-intelligence": {
      "command": "node",
      "args": ["/absolute/path/to/personal-intelligence/mcp-server.cjs"],
      "env": {
        "NATHAN_VAULT_DIR": "/absolute/path/to/approved-sources"
      }
    }
  }
}
~~~

Tools: `list_sources`, `search_vault`, `read_source`, `get_image`. The MCP process does not open a socket, change any file, run code from a file, sync browser IndexedDB, copy credentials, or contact model providers. It ignores hidden/credential-like files, rejects symlink traversal, and limits scans and source sizes. To use browser originals with MCP, first explicitly export/copy files to that folder.

## Verified ZIP to MCP retrieval

The user's file/image archive is stored in the browser Vault. To make the *original backed-up files* available to a local AI client **with deliberate permission**, create full-byte ZIP backups in the app, save them to the laptop, then run:

~~~bash
node import-backup.cjs /path/to/nathan-pi-original-backup-part-001-of-001.zip /path/to/my-approved-mcp-folder
NATHAN_VAULT_DIR="/path/to/my-approved-mcp-folder" node mcp-server.cjs
~~~

The importer verifies the existing backup manifest and every original's SHA-256 before writing a content-addressed, non-overwriting copy to the selected folder. It keeps a hidden local provenance manifest. The read-only MCP service can then retrieve actual text and image bytes from that folder through an authorized MCP client. If there are several ZIP parts, import them all before claiming complete recovery. **This is owner-triggered transfer, not continuous synchronization of all AI accounts.**

## NATHAN OS (V1.0-RAW) mapping

| Supplied original module | Executed by this app | Not yet implemented |
| --- | --- | --- |
| 01 Zero-Bias Core | Testable source contracts and deterministic input validation | Kernel/assembly memory clearing, total model bias removal |
| 02 Immutable Vault | Shared original-byte storage, checksummed ZIP export/restore | Hardware immutability or private cloud buckets |
| 03 Multi-AI Gateway | Manual, reviewed packets + local read-only MCP tools | Automatic cross-provider OAuth/account synchronization |
| 04 Terminal Interface | Responsive installable PWA | Native operating system kernel |

The original C/Go/Flask source snippets are **user-supplied specifications**, not evidence of a deployed kernel, immutable disk, or synchronized AI provider network. Keep those originals unmodified in an owner-controlled source archive. This module is a safe user-level implementation without modifying system kernel paths.

## Verify the build

~~~bash
node --check app-factory/nathan-ai/personal-intelligence/app.js
node --check app-factory/nathan-ai/personal-intelligence/core.js
node --check app-factory/nathan-ai/personal-intelligence/mcp-server.cjs
node --check app-factory/nathan-ai/personal-intelligence/import-backup.cjs
node --test app-factory/nathan-ai/personal-intelligence/core.test.cjs app-factory/nathan-ai/personal-intelligence/mcp-server.test.cjs app-factory/nathan-ai/personal-intelligence/import-backup.test.cjs app-factory/vault-backup.test.cjs
~~~

Manual browser QA required: upload a photo, preview/download it, open the existing Vault and see the same file, save linked notes, query source metadata and text, prepare metadata-only/full-excerpt handoffs, back up all bytes, restore in another profile, check image and SHA recovery, connect MCP to a knowingly selected directory, and remove the MCP client configuration to revoke access. Test both phone and laptop.

**Not claimed working:** production private multi-tenant accounts, remote cloud storage/encryption/key recovery, real cross-device background sync, provider account OAuth, hosted MCP, model execution, paid model billing, app store signing. They require additional private infrastructure, credentials and authorization. Reuse [Universal Creator Vault production plan](../../UNIVERSAL-CREATOR-VAULT.md) and [AI Sync Protocol](../../AI-SYNC-PROTOCOL.md) if adding them later.

## Founder methodology dossier

The creator's documented method emphasizes original-source preservation, linked personal memory, phonetic/root analysis as attributed analysis, deterministic rules where testable (`1+1=2 BUILD` and `1-1=0 CLEAR`), cumulative software and creative work, using several compatible AI interfaces while holding independent source records, mobile-first operation, full-byte backup, and teaching others to establish their own intelligence environments.

Preserve distinct identities: NATHAN AI, ONE, TABOR 1-2-3 FACTORY, Memory Matrix / meSPARK, Knowledge Engine and Universal Creator Vault. This module is additive; it does not rewrite existing author source, private files, or original projects.

## Omni minds and complete Personal Intelligence Atlas

[Open the source-preserving Minds Atlas](./minds/index.html) · [Architecture dossier](./minds/README.md). This additive module reuses existing OMNI GOD Core (126-billion conceptual address namespace and its original 20-name pantheon), historical source lenses including Jesus/Buddha, the creator-defined Turtle worker routing and Leonardo da Vinci synthesis, Quad-Axis Renaissance source, Cero/Uno/Dos metadata, and live read-only access to existing public Omni, Complete Mind, and Absolute Intelligence catalogs. It does not instantiate billions of agents, extract unseen personal files or simulate literal historical consciousness. Existing original bytes and names remain untouched.

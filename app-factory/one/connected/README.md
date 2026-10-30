# ONE Connected System — Apps × Books × Images

**Creator:** Nathan Tabor  
**Governing principle:** Sovereignty + sovereign free will. **FREE means FREE.**  
**Architecture:** NATHAN AI → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE.  
**Rule:** CREATE ONCE. TRANSFORM INTO EVERYTHING. PRESERVE THE ORIGINAL.

[Open Connected System](./index.html) · [ONE Home](../index.html) · [ONE Master Library](../library/index.html) · [Creator Vault](../../vault.html)

## What this module actually does

- Discovers the curated **public** Factory product registry at ../../products.json and links the public ONE books/apps/game modules already present in the repository. Public registry rows marked private-prototype or concept remain labeled that way; listing is not evidence of a completed product or live backend.
- Reads **existing browser-local** records from the ONE Master Library IndexedDB database \`tabor-one-private-master-library-v1\` and Creator Vault IndexedDB database \`tabor123_vault_v1\`. Only available in the same browser profile and web origin; does not access another device, account, phone app or other AI provider.
- Surfaces private books, images, documents and archival records **only if the owner already imported them to one of those two existing systems**. It does not insert owner materials in the public repository.
- Loads private Factory *project titles* from the existing \`tabor123_projects_v1\` browser-local storage value, where present. Only metadata is indexed in RAM.
- Previews supported raster images **on explicit click** by reading their original Blob from the Vault and issuing a temporary object URL. SVG/HTML imported files are not executed as preview.
- Creates owner-approved edges (illustrates, adapted-as, belongs-to, references, connected-with, source-of). Saves link IDs and labels only under \`one.connected.owner-links.v1\` in browser localStorage. Does not alter original Master Library, Vault, or private encrypted Offloader.
- Exports/imports a standalone relationship JSON file (schema \`one.connected.owner-links.v1\`) with stable origin-prefixed IDs; imports merge by exact relationship key. Restored links can be reconciled even when a source hasn't yet been imported on that browser.

## Import the existing private bridge

The private **ONE Connected System v1** and \`ONE_MASTER_LIBRARY_D17_33M_BRIDGE.json\` were prepared separately on October 30, 2026. The source-only bridge is an additive \`one.library.private-pack.v1\`-compatible index. Open **ONE Master Library → Import selected files** and deliberately import the owner's original bridge file. Then return here and click **Rescan existing sources**. Keep the private original data and packages outside public GitHub.

To connect locally saved image files and book source documents, open **Universal Creator Vault → Import selected files** first. The 33-million-book plan is an address/capacity blueprint, not 33 million finished manuscripts; language entries, completed manuscripts, book concepts, editions, images and app prototypes retain distinct provenance and stages. No synthetic record is used to claim an unimported original.

## Sovereign binary checks

\`0\` = a particular gate is **not yet verified**. \`1\` = that particular gate **passed**. These are whole values, never fractional scores. Neither value labels a person, language, culture, source, idea or research direction as inferior, irredeemable, or impossible. A project can remain open to further research and owner judgment without inventing facts. Owner approval (\`ownerApproved:1\`) of a relationship is deliberately distinct from historical verification (\`externalVerified:0\` unless independently established elsewhere).

## Security and deployment boundaries

This screen fetches only the **public same-origin** product registry. It makes **no private data upload**, no cross-site AI API call, no OAuth grant, no automatic background sync, no publishing, no deletion of originals, and no decrypted access to the separate Sealed Voice Box. Imported content is displayed using DOM textContent, not executable HTML. The discovery scan is capped at 100,000 entries per local store per view, and explicitly marks an incomplete scan. The relationship manifest **is not an originals backup**. The user must preserve independent Master Library exports and Vault full-original byte ZIPs.

Browser IndexedDB/localStorage may be lost when website data is cleared. Browser profile and origin partitioning apply. Production encrypted synchronization, owner identity/permissions, universal provider connectors, image rights checks, and bulk book translation are separate unimplemented integration stages.

## Tests

\`\`\`sh
node --test app-factory/one/connected/connected.test.cjs
node --test app-factory/quality.test.cjs
\`\`\`

Static tests verify syntax, source isolation and canonical navigation; real cross-browser/device behavior and runtime privacy/security need separate browser tests.
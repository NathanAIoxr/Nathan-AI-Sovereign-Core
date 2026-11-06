# ONE — MASTER LIBRARY 101–901

**By Nathan Tabor** · Source-first, author-controlled library integrated directly into ONE — The Last App.

[Open inside ONE](../index.html) · [Open the library screen](./index.html)

## What exists now

- Nine **library shelves** 101, 201, 301, 401, 501, 601, 701, 801, 901. These are **navigation categories** and do **not** replace ONE's independent 101–901 engineering architecture or the author's original classification decisions.
- ONE home launch panel plus dedicated in-app **MASTER LIBRARY** tab.
- Search/filter across locally imported source records, scored project entries, 301 Faith/KJV works and original text documents.
- Author-source preservation: the imported raw record is kept in `original`; source bytes are held separately in local IndexedDB with an SHA-256 fingerprint when Web Crypto is available. Full-document text is displayed as plain text, never executed as HTML.
- A deliberate local import step, record reader, per-source original download, index export and explicit local delete confirmation.
- No external provider access, automatic ChatGPT history reads, backend ingestion or cross-account sync.

## How to import the owner-only master archive

The private archive is stored **outside GitHub** in the owner's ChatGPT Library under:

`/Main Database/MASTER_LIBRARY_101-901/PRIVATE_ONE_IMPORT_v1/`

Download `ONE_MASTER_LIBRARY_PRIVATE_IMPORT_PACK_v1.json` to the device, open ONE → MASTER LIBRARY → choose file → **Import selected files**.

The private pack contains **6,056** inherited registry rows, **333** project references, **133** related faith/KJV records and **two** source-preserved work documents (Amazonian Women and Helplessness/Barnabas). These **6,524 index positions** may overlap; they are not 6,524 completed products, publications or distinct books.

Compatible direct imports:
- `TABOR_TOTALITY_MASTER_CATALOG_v017.json` (`source_records` and `scored_projects`)
- `KJV_SPIRITUAL_WORKS_INDEX_v2.json` (`tabor.faith-index.v2`)
- `ONE_MASTER_LIBRARY_PRIVATE_IMPORT_PACK_v1.json` (`one.library.private-pack.v1`)
- Individual UTF-8 `.md`, `.txt` and supported `.json` owner files

The import intentionally makes no network requests. The public GitHub repository **does not contain the user's private archive or manuscripts**.

## Preservation, privacy and stages

**CREATE ONCE. TRANSFORM INTO EVERYTHING. PRESERVE THE ORIGINAL.** Exact source, authorship, privacy and version information always outrank an assistant's labels. Source descriptions, creative canon, history verification, and assistant editorial notes must remain distinct. A title or cover never establishes a complete manuscript or published work. The 101–901 shelf assignment is an editorial discovery index only.

Records reside in the current browser's **unencrypted** IndexedDB and may disappear if browser storage is cleared; on shared devices other people with access to the browser profile may access them. The import module is not a replacement for the full original-byte [Universal Creator Vault](../../vault.html), secure authentication, encrypted cloud backup or native platform storage. Export/index is not a complete original-bytes backup: keep the source pack and original files separately.

Do not commit private source files, raw author chats, confidential family material, account tokens or unrestricted private catalogs to this public repository. Publication requires a separate author approval and a reviewed release gate.

## Build/test

```sh
node --test app-factory/one/library/library.test.cjs
node --test app-factory/one/one.test.cjs
node --test app-factory/quality.test.cjs
```

This is a working local-first browser module. Multi-user identity and encryption, server-side search, native device testing, continuous sync, and store releases are not implemented.

# ONE — Offline ChatGPT Library Bridge

An open-source, local path from a downloaded ChatGPT account export and Library files to a searchable private ONE index. This is an import tool, not a live ChatGPT account connector. It cannot change ChatGPT's permissions through a pasted prompt.

## Connect your files

1. In ChatGPT, request your account data export through Settings → Data Controls → Export Data, if this option is available for your account. Download the resulting archive using the account's official export flow.
2. Download the images and documents you want from your ChatGPT Library (or Space, if your account uses that interface). An account export is not assumed to contain every original Library asset. Keep these downloads together, preserving folders where possible.
3. Run this tool on your own device:

```sh
python3 bridge.py "/path/chatgpt-export.zip" "/path/LibraryDownloads" --out "/path/ONE-index"
```

On Windows, use `py` instead of `python3` if appropriate. The output folder must be outside every input folder. Supply only folders you intend to index; do not select your whole account home directory.

4. Open `ONE-index/search.html` in a browser. No server or login is required. Search conversation titles, message text, filenames and extracted document text. Filter by record type and inspect the coverage report.
5. To make the index available to this ChatGPT conversation, attach `index.json` (or smaller batches) using ChatGPT's normal attachment interface. Sharing the index can reveal your private content: review it before sharing. Access to the local index does not automatically attach original files; attach originals when needed for further work.

You can also attach the downloaded account archive and Library files directly to a conversation that supports file analysis and run this importer there. Upload/archive size limits depend on the ChatGPT interface. Do not provide account passwords, recovery phrases, cookies, session tokens or API keys.

## What is indexed

- Standard `conversations.json`: conversation title and ID, message ID, parent node, role, message text and attachment references. All mapping nodes are retained; alternate branches are not silently discarded. References are labeled unverified, not asserted to resolve to a downloaded original.
- Original files: filename/path, SHA-256, size, duplicate identity and extraction status. Exact duplicates remain visible but do not inflate unique-file code counts. Original inputs are never modified.
- UTF-8 text and code. Physical code lines include comments and blank lines and use filename extensions; they do not prove a complete historical codebase. Fenced code blocks in messages are counted separately and may overlap or repeat earlier code.
- PDFs with a readable text layer when the optional `pypdf` package is installed. Empty/image-only PDFs are labeled as requiring OCR.
- DOCX/PPTX text and XLSX shared strings. Layout, formulas, embedded files and numeric-only worksheet cells are not fully extracted.
- Images: file metadata and dimensions where the optional Pillow package supports them. No OCR, visual interpretation or biometric inference is performed.
- ZIP exports: first-level entries are read without extracting to the filesystem. Nested ZIPs receive metadata only.

Optional text/metadata dependencies:

```sh
python3 -m pip install pypdf Pillow
```

The tool itself makes no network requests. Optional package installation requires normal package-registry access.

## Coverage and privacy

`coverage.json` records actual inputs, counts, extraction gaps, missing-original references, skipped paths and errors. It never asserts account-wide completion. `index.json` includes searchable private text. `search.html` embeds that same private index for offline use. Keep all three private; they are not encrypted backups.

The tool excludes recognized credential/configuration paths and dependency caches. It redacts recognizable credential patterns from extracted text; this is not a comprehensive secret detector. Review output before sharing. It does not authenticate to ChatGPT, inspect browser profiles, refresh account tokens or access unspecified folders.

Limits: 128 MiB per file, 2 GiB total input, 100,000 searchable characters per record, guarded ZIP compression ratios. Truncated text, extraction errors and skipped files are reported. Split larger exports into supported batches. A JSON conversation export over 128 MiB requires preprocessing into smaller standard conversation arrays. Originals remain the authority.

## Test

```sh
python3 -B -m unittest discover -s . -p test_bridge.py
```

Five tests cover conversation branches/references, code-line deduplication, credential redaction, ZIP path exclusions and safe HTML generation. Browser testing covers offline search, type filtering and inert source content.

# TTFES&BTP
## THE TABOR FINGER ELECTRIC SLIDE AND BUTTON TAPPING PROCESS

**Original creator / architect:** Nathan Tabor  
**Role:** An independent, free, local-first, source-preserving, cross-platform creator and field-transport workstation.  
**License:** MIT.  
**No paid services, APIs, libraries, hosted backend, credentials or Nathan AI Factory runtime required.**

> BUILD THE ENTIRE WORK; PRESERVE THE ORIGINAL; MAP ALL DESTINATIONS; REVIEW; LET YOUR FINGER DO THE ELECTRIC SLIDE.

### Start the standalone app

Open [the standalone application](./index.html) at this folder's deployed HTTPS URL. For local development, serve the folder:

    cd standalone-apps/ttfes-btp
    python3 -m http.server 8000
    # open http://localhost:8000/

The product consists solely of the files **inside this folder**. You can copy that folder to any ordinary HTTPS static host. Its optional service worker caches the public application shell for offline use, never private manuscript input. There is no dependency on the previous Kickstarter or KDP applications, external CDNs, cloud APIs, or proprietary software.

### What is actually usable now

- **133 named destination workflows across 22 sectors.** See [SCOPE.md](./SCOPE.md) for full scope. All include mapped generic field names for local export and manual use, not authenticated provider integrations.
- **Original-source vault:** paste an untouched manuscript or locally load UTF-8 TXT/MD. The application preserves the imported binary file bytes as a separate ZIP entry when unchanged, plus a readable UTF-8 text copy. Editing the text breaks the original-byte association instead of silently substituting content.
- **Author your field values:** select any target, edit its own field map, switch targets without replacing another target's fields, and keep each derivative independent from the original.
- **Creative prompt:** generate a destination-specific ChatGPT prompt with strict original-source boundaries, empty unknown fields and no invented provider certification.
- **Multi-target batch:** choose 1–133 targets, attach up to 30 local assets (32 MiB total), export ZIP (original, all field drafts, per-target Markdown previews, CSV references, SHA-256 receipt, handoff guide) with one finger tap.
- **Individual output:** copy one logical field; export current target JSON; export all field mappings as a generic CSV; save and restore an editable source-bearing workspace JSON.
- **Government and financial safeguards:** prepare project abstracts, objectives, narrative, grants, eligibility evidence, citations, budgets and scope. Actual tax IDs, bank account details, residency data and binding certification declarations are intentionally excluded from the local field editor. Use each official provider to enter them and approve submissions.
- **Private, owner-operated browser companion:** [extension/](./extension/) is an optional Chrome/Chromium MV3 extension; permissions are only activeTab and scripting. It inserts a manual panel into the user-selected active tab, without background scripts or arbitrary host permissions. Transfers one chosen field to one focused editable control; never presses submit, publish, pay, attest or launch.
- **No invented completion status:** all destination packets clearly state submitted:false, published:false, and verifiedProviderFields:false. Source fingerprints do not prove ownership or publication.

### The four processing planes

1. **Geometry:** exact character positions, source structure, stacks, charts, grids, axes, and dimensions.
2. **Logic:** 1+1=2 — BUILD and 1-1=0 — CLEAR; a rejected derivative can be cleared without deleting the original input.
3. **Phonetic:** original spelling, sounds, visual letter-geometry, acrostics, mirrors, reversals and creator-defined ciphers; transformations always remain separate.
4. **Deployment:** a destination adapter drafts fields, supports copying and packaging, and provides explicit owner review of the external interface.

The nine register axes include source, structure, direction, language, format, destination, permission, status and revision. The learning stacks comprise source records, indexes, matrices, grids, dimensions, language, scripture/knowledge comparison, artifacts, publishing metadata, workflow and provenance.

### What is *not* claimed

This release does **not** automatically log in to Kickstarter, Amazon, Shopify, Grants.gov, SAM.gov or any other account; it does not automatically submit applications, certify legal or tax statements, post ads, charge cards, alter financial records, transfer cryptocurrencies or publish to live stores. Generic CSV reference sheets are **not claimed to be official upload schemas**, and the extension deliberately avoids guessing selectors or pushing forms to submission.

A genuine authenticated adapter per provider would require API documentation, scopes, OAuth or delegated permissions, secret handling outside the browser, destination-specific schema validation, operational testing, and explicit final approval. Any regulatory or identity verification is performed directly in the official site.

### Files

- index.html, styles.css and app.js — complete user interface and interaction.
- catalog.js — 133 mapped destinations in 22 sectors, field definitions, workflow classifications.
- engine.js — canonical source/derived separation; safe CSV; hash; prompt; ZIP writer; batch artifact.
- engine.test.cjs — exhaustive catalog, government, identity, provenance, safety and packaging tests.
- extension/manifest.json, extension/popup.html, extension/popup.js — optional Chrome/Chromium field-click companion.
- sw.js, manifest.webmanifest, icon.svg — standalone installable offline shell.
- SCOPE.md, GUIDE.md, LICENSE — inventory, operation and redistribution.

### Run verification

From repository root:

    node --test standalone-apps/ttfes-btp/engine.test.cjs
    node --check standalone-apps/ttfes-btp/engine.js
    node --check standalone-apps/ttfes-btp/catalog.js
    node --check standalone-apps/ttfes-btp/app.js
    node --check standalone-apps/ttfes-btp/extension/popup.js

The dedicated GitHub Actions workflow runs these tests and verifies a generated ZIP with Python's ZIP reader. Do not call an external platform "tested" until its specific API or browser interface has been individually checked.

### Privacy and authorship

The original creator's architecture, titles and unique phrases are attributed to Nathan Tabor. The code in this public directory is distributable under MIT, but **private manuscripts or original chat transcripts are not copied into the public repository by this tool**. Anything entered in a local form stays local until the operator explicitly exports or pastes it elsewhere. Exported files may contain private text and must be protected. SHA-256 is an integrity fingerprint, not encryption or a signature.

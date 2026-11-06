# TTFES&BTP — HANDS-ON OPERATING GUIDE
## Nathan Tabor's Finger Electric Slide and Button Tapping Process

The app is independently hosted HTML/CSS/JavaScript. No ChatGPT plug-in, GitHub login, build system, paid SaaS, external scripts or Nathan AI parent app is needed for the core.

## First run

1. Open the hosted standalone index.html in a modern browser (HTTPS preferred, needed for some clipboard/security APIs). On a cloned repository, start a local web server; do not rely on opening file:// for the service worker.
2. Use **01 / SOURCE VAULT** to paste an exact original or choose a UTF-8 TXT / MD file. File import keeps the original exact bytes separately in memory. Editing the textarea deliberately switches to the edited text and releases the imported byte association.
3. Give the project a title, creator and source-reference label. Keep independent archival originals regardless of what is packaged.
4. Use **02 / DESTINATIONS** to search or filter any of the 133 named workflows. Click ADD TO BATCH or ADD FILTERED TARGETS. Selections can include government, commerce, publishing, media and internal records simultaneously.
5. Use **03 / WORKBENCH** to choose an active destination, fill logical data fields and switch to another. Draft fields for separate targets remain separate in memory.
6. Use MAKE CHATGPT CREATIVE PAYLOAD PROMPT to build a structured, source-preserving request. Copy it and use ChatGPT separately. Paste only creator-reviewed replies back into the relevant fields; generated text does not become verified evidence.
7. Use **04 / TRANSPORT DECK** to attach source assets and click BUILD + DOWNLOAD FULL BATCH ZIP. Source original and per-destination files are separate in the archive. A SHA-256 integrity fingerprint and UTC timestamp are included. You may also save/restore the editable workspace file or export single-target JSON and generic CSV.
8. In the provider site, copy a field manually, or use the optional extension for focus-and-tap. Check that the target website actually accepted each value. Provider approval/launch/payment/filing always stays on its own official controls.

## Reading the ZIP

- SOURCE/original-text.txt — UTF-8 original content exactly as captured by the standalone text model.
- SOURCE/original-file-bytes.bin — unmodified bytes of the imported source file (when present and unchanged).
- ASSETS/ — unchanged local media and attachments the creator selected.
- DESTINATIONS/provider-id/draft.json — one independent, versioned logical draft per destination.
- DESTINATIONS/provider-id/fields.csv — a UTF-8 generic field-mapping reference for that destination.
- DESTINATIONS/provider-id/preview.md — human-readable proposed values and final review checklist.
- MANIFEST/receipt.json — local timestamp, SHA-256, selected targets and clear NOT SUBMITTED/NOT PUBLISHED status.
- MANIFEST/overview.csv — overview of all target/field/value mappings.
- README-FIRST.txt — review and handoff instructions.

These CSV files are deliberately generic. A Shopify, Etsy, Kickstarter, Grants.gov or SAM.gov uploader must NOT be assumed to accept them directly. Provider-specific ingestion formats must be verified for a real integration.

## Chrome / Chromium extension setup

1. Obtain the standalone folder from GitHub (or download the repository ZIP).
2. Open the Chromium extensions page, enable developer mode, choose Load unpacked and select the standalone app's **extension/** folder.
3. Open the desired provider's website in your own account. Open the extension popup and paste an exported single-destination JSON draft.
4. Select OPEN FOCUS-AND-TAP CONTROLS. This activates a small panel in the currently selected tab; it doesn't change any form yet.
5. Choose the field you want to move; click a normal writable text field ON THE PAGE, then press Alt+Shift+V or click FILL LAST FOCUSED TEXT FIELD.
6. Visually inspect the result. If the provider runs a proprietary editor or rejects the value, use the standard COPY SELECTED FIELD in the standalone UI and paste manually. The extension does not bypass platform rules, captchas, identity checks, accounts, forms, or review gates.
7. Close the panel when finished. Draft data is not persisted in the extension. The popup clears its pasted draft after a successful insertion.

**Permissions:** activeTab and scripting only. There are no broad host permissions, background service workers, external messaging endpoints, tracking, clipboard history monitoring or credential vaults. The extension's code is inspectable under extension/popup.js.

## The government lane is a complete *preparation* process

1. Choose the correct grant, SAM, public comment, FOIA, patent or business registry draft lane.
2. Supply only your non-secret facts: organization, project objective, narrative, budget JUSTIFICATION, references and qualifications.
3. Validate facts against original documents. Unknown eligibility must remain unknown, not be implied as approved.
4. Leave tax numbers, banking details, account credentials and binding certifications OUT of this app. Fill these only in the official portal after review.
5. Open the actual government portal yourself and obey its account, verification, form, accessibility, record and deadline requirements.
6. Save the official submission receipt independently; the local package cannot create one.

Government portal content, platform labels, legal regulations and application requirements can change. These are independent draft schemas, not official agency integrations.

## Other sensitive sectors

- Ads: budget field is a proposal, not permission to spend.
- E-commerce: stock and pricing fields are drafts, not real inventory updates.
- Real estate: tenancy, occupancy, law, rates and safety details must be checked.
- Web3: NEVER include private keys, seed phrases or signature authority. Public address text is just a draft and must be verified manually.
- Job portals: proposals, candidates and screening questions require privacy/fairness review.
- Education: student records and grading are not appropriate for uncontrolled export.
- Medical or tax details: do not put sensitive personal data into general text exports.
- Research and scripture: phonetic, mirrored and symbolic readings are separate author-defined interpretations, not proof of historical etymology.

## Troubleshooting

- **Clipboard not available:** use HTTPS or download the JSON/Markdown/CSV file and copy manually.
- **ZIP won't save:** confirm your browser's download permission and memory. The package is limited to 64 MiB; separate large images into multiple packages.
- **Original file line endings look different:** file import maintains the original binary bytes as a second ZIP item; the editable textarea may normalize display line breaks.
- **JSON doesn't import:** use an exported workspace JSON from this standalone app. A destination draft JSON is a different artifact and is for the extension or selected output.
- **A field is missing:** look under another target's exact sector; each has independently defined logical fields. New mappings must be added in catalog.js and tested.
- **Extension field didn't fill:** inspect that you clicked a normal writable text input, not a hidden, readonly, login, payment, government certification or custom shadow-DOM control. Use manual copying if incompatible.
- **Offline:** after HTTPS service worker successfully caches the static shell, pages can load without continuous network access; private input is not automatically stored. Save a workspace JSON before closing the tab.

## Acceptance criteria before claiming an external platform is connected

A platform becomes a genuinely integrated endpoint only after its current official API/import schema has been verified; authorization/ownership verified; allowed operations scoped; financial/legal disclosure behavior validated; write action staged and confirmed with explicit human approval; and test receipts prove what the provider actually accepted. Without those, its state remains LOCAL PREPARATION.

**1+1=2 BUILD · 1−1=0 CLEAR THE DERIVED OPERATION · ALWAYS PRESERVE THE ORIGINAL.**

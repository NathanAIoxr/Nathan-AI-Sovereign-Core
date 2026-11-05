# Nathan AI — Joy Studio (open-source prototype)

**The refrigerator-door calendar meets a digital scrapbook.** Keep memories, holidays, cards, handwritten messages, writing, and privacy evidence in one offline-first creative workspace. Existing Nathan AI apps are preserved as separate programs and can be linked through adapters rather than being overwritten.

## Run it

Open `index.html` directly in a modern browser. No build step, login, API key or online service is needed. If your browser restricts local file features, run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`.

## Working today (v0.1)

- **Fridge Calendar:** month view, custom birthdays, holidays, appointments and reminders; editable events; built-in common US fixed-date examples and Thanksgiving; `.ics` export for import into calendar software.
- **Zero-Scrap Studio:** 12 holiday/occasion themes, text/sticker/heart/photo layers, pointer drag positioning, layer editing, colors, fonts and rotation, saved editable designs.
- **Distribution:** export a 960×640 PNG, self-contained *static* HTML, editable JSON; open an email draft with a **manual attachment step**; browser print / save as PDF.
- **Words Room:** user-authored text preserved verbatim in a writing draft; optional sample homophone hints, reverse-words, reverse-characters, acrostic and word-per-line transforms; send draft to scrapbook.
- **Memory Library:** local project shelf, open/delete, complete JSON backup and restore.
- **Privacy Shield:** client-side SHA-256 exact-file hash and comparison; locally stored incident evidence notes; draft a platform-review request. No uploaded content is sent to a service.
- **ONE app universe:** distinguish working features from planned adapters and save URL-only launchers to trusted external apps. A launcher **does not** pass data to an external site.

## Local privacy & data model

The app makes **no network requests** itself. Fonts are supplied by the device. Designs and photos are stored as browser `localStorage` entries; photos are raster-reencoded, downsized and embedded in exports. Storage quotas depend on device/browser and backups are essential. Sensitive projects should be kept on a trusted device, and exports are not encrypted by this prototype.

A SHA-256 checksum is an **integrity fingerprint**, not proof of legal ownership and not a biometric or perceptual-duplicate detector. A changed/recompressed photo will produce another hash. The program does not crawl the open web, private services, Tor/dark web, or detect faces in video. It cannot remove third-party files, disable remote infrastructure, or guarantee that unauthorized content is found. The roadmap describes opt-in public/authorized detection and provider takedown workflows.

## User experience

1. Open the **Fridge Calendar** and add a birthday, anniversary or event.
2. Enter **Scrapbook Studio**, select a theme, drag layers, upload a photo and edit the message.
3. Save to the **Memory Library**; export to HTML/PNG/JSON; open an email draft and attach the export.
4. Visit **Words & Writing** to produce a heartfelt note, poem, acrostic or phonetic exploration and send it to the page.
5. Use **Privacy Shield** to record a local hash or evidence of suspected misuse.

## Packaging and integration

Place the whole directory as a **new** additive module at `app-factory/one/joy-studio/` in the `NathanAIoxr/Nathan-AI-Sovereign-Core` repository. Avoid replacing any existing files or module interfaces. The module is dependency-free; `app.js` exports several pure utilities under CommonJS for `node --test`.

## Open-source license

This add-on is offered under **Apache-2.0**, matching the root repository's existing license (verify the parent repo's policy before merging). See `LICENSE` in the parent repository or https://www.apache.org/licenses/LICENSE-2.0 .

## Important boundaries

- **Source-aware lore:** mythology, word inversion, ciphers and theological reinterpretations belong in clearly tagged *creative hypothesis / primary source / verified finding* records. For example, modeling “trinity” as eight is a user-defined creative system, **not** historical evidence for a secret Vatican structure.
- **Safe enforcement:** No unauthorized network access, exploit development, remote wipes, payload corruption or cross-platform hacking is included or proposed.
- **Consent:** Photos featuring other people should only be shared with permission when applicable. Face/biometric indexing, if ever built, needs explicit informed consent, retention/deletion controls, false-positive review and strong user safeguards.

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [SECURITY.md](./SECURITY.md) for the macro/micro implementation roadmap.

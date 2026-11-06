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

---

## Joy Studio v0.2 — playable game and full creative workflows (November 2026)

The original v0.1 implementation remains intact. Version 0.2 **adds** the following functional modules:

### 🎮 Joy Game World

- **Holiday Memory Match:** a touch/keyboard-friendly 4×4 board with eight pairs, matching feedback, move count, restart, victory state and stars for completed games.
- **Family Joy Bingo:** 25 challenge squares, a free center, twelve potential bingo lines (five rows, five columns, two diagonals), check/uncheck actions, a fresh-board option and earned-star history.
- **The 25 Doors of Joy:** all 25 doors are playable year-round, each with a creative prompt; journal entries save locally and can be turned into an editable scrapbook page.
- **Inspiration Machine:** twenty holiday and occasion prompts. Spin a suggestion, then turn it into an editable card with the corresponding celebration theme.
- **Joy Stars, levels, badges and quests:** progress earned by saving actual designs, pinning dates, writing, exporting, creating magnets and playing games. Stars, door journals, bingo progress, achievements and match wins are stored alongside user projects, included in the portable JSON backup. No real-money prizes, wagering or online leaderboard.

### 🎨 Expanded zero-scrap design

- Twenty-four ready-to-use sticker choices, with all old design layers editable.
- Four one-click starting arrangements: postcard, invitation, photo frame, thank-you note.
- **Undo, redo, duplicate layer**, keyboard arrow nudging, and an optional five-percent snap grid.
- Switch color themes **without deleting existing layers or text**.
- When starting new layouts from a game prompt, magnet or new-page command, the current draft is first preserved in the memory library.
- Library search, theme filter and non-destructive design duplication.

### 📅 Refrigerator family organizer

- Colorful handwritten-style pinned **fridge magnets**; convert each note into a card.
- Birthdays, anniversaries, reminders, family occasions and **annual recurrence** for custom calendar entries, including an iCalendar recurrence rule in `.ics` exports.
- Each calendar event gets a **CARD** action that makes an editable scrapbook page with the event's name and notes.

### ✍ Words and writing

- Six additive starter templates (birthday, Christmas, gratitude, family memory, invitation and acrostic poetry), which never replace an existing user draft.
- Optional browser-native read-aloud when supported. The browser's speech engine availability and voice selection depend on the device.
- Unchanged legacy phonetic, reversal, acrostic and vertical-writing experiments. Any transformation is explicitly a suggestion; original words remain unchanged.

### 🛡 Privacy and permissions

- Local permission ledger for an asset, an intended recipient or platform, and a private/allowed/withdrawn status. This **records a user's statement**, not an enforceable revocation of somebody else's copy.
- Existing SHA-256 exact-file checks, evidence notebook and report template remain. There is **no** global, dark-web, biometric, private-platform or automated takedown scan.

### Practical setup and testing

1. Open `index-standalone.html` for a single-file offline interface, or `index.html` to load the modular CSS and JS in the same directory.
2. Select **Joy Game World** in the left navigation; play the games and turn a game prompt into a scrapbook.
3. Save to the library, export to PNG/HTML/JSON, or open your email application to attach the downloaded export.
4. Select **Back up everything** regularly: the portable backup includes creative projects, original writing, calendar events, magnets, permission notes and saved game progress.
5. Run `node --test test-core.cjs` to run 12 pure-logic tests. The browser interaction smoke run covers gameplay navigation, card generation, editing, event creation, note and consent entry, reload and restored local data.

**Local storage limitations:** browser storage is not encrypted, per-browser quotas vary, and large embedded photos can exhaust capacity. Do not treat local storage as a secure cloud or guaranteed archival system. Password-protected backup, real email-provider sending, full historical calendars, advanced language databases and authorized opt-in public-media monitoring are not shipped in this version.

### Device sharing and installation

If the browser supports the Web Share API with files, **Share with device apps** can pass an exported PNG to the device's own share picker, where the user can choose Mail, Messages, or another installed app. Otherwise, a PNG download is offered. The program does not silently send email or obtain email account access.

When served over HTTPS or `localhost`, the modular `index.html` includes an optional installable PWA manifest and same-origin service worker that caches **only static application assets**. It does not cache or transmit personal scrapbook data. To publish it, serve the folder via HTTPS on a host you control. `index-standalone.html` is self-contained and needs none of these companion files.

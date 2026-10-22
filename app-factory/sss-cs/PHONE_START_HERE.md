# SSS-CS PHONE TEST — START HERE

**App:** Super Supper Symbiotic Computer System (SSS-CS)  
**SSS:** Simply Sensational Software · **CS:** Clause Santa  
**Core:** YULL LAW Christmas Spirit · 4T Engine · YALL LAW Christmas Ghost.

This build is a **Progressive Web App (PWA)**: a mobile-friendly app that can be added to the phone's Home Screen, run in an app-style window, and work offline *after first loading it from an HTTPS website*. It is not an iPhone IPA or Android APK, and it has **not yet been installed on your particular phone**.

## The fastest real-phone route

1. Unzip `SSS-CS-PHONE-WEB-READY.zip` on a computer.
2. Put the **contents of its `web` folder** on an HTTPS website that you control. One option is **GitHub Pages**. Publishing a Pages website makes its app files and artwork publicly accessible; **do not do this if you require the source and artwork to remain private**. A private HTTPS hosting provider is another option.
3. On **iPhone**: open **your own HTTPS app link in Safari**. Tap **Share → Add to Home Screen → Add**. Launch **SSS-CS** from its icon.
4. On **Android**: open **your own HTTPS app link in Chrome**. Open **⋮ → Install app** (or **Add to Home screen**), then launch it.
5. Inside the app tap **📱 SSS-CS PHONE TEST LAB → SET UP & TEST → RUN ALL SELF-TESTS**. Then follow the five manual checks below.

There is **no live hosted app URL in this package**. A `sandbox:/...` download link is a downloadable file, *not* an HTTPS website where a PWA can be installed. Merely downloading the ZIP onto iOS is not enough to install it.

### Optional GitHub Pages deployment (publishes code + artwork, not personal vault records)

Create a new repository for the web app and upload the contents of `web/` directly into the repository root. In repository Settings → Pages, choose **Deploy from a branch**, then `main` and `/ (root)`. Visit the resulting HTTPS Pages URL to install. Publication and website provisioning must be performed or approved by the account owner. Do not upload local backups, personal records, passwords, evidence exports, or the Python PDF service to the public website.

### Important differences between browser and Home Screen

Install **before** creating valuable records. Some phone operating systems separate the Home Screen app's storage from the browser's website storage. This app does not automatically transfer that data, so always use **Homes in Harmony → Export Backup** and keep your vault passphrase.

## Manual acceptance tests

1. **YULL LAW → Notes**: Unlock / Initialize the Manor Vault using a new 12+ character test passphrase. Enter a test note and press **Encrypt & Save**. Reopen it to confirm the original wording remains intact.
2. **4T Engine**: Switch chambers by tap, swipe, or slider. Tap **BOOT SSS-CS**. Verify the diagnostics say external VPN/firewall/cloud sync are not configured.
3. **YALL LAW → Security**: Enter `scrape_data`, run the Christmas Ghost check, and confirm the test shows simulated DENY and **real network action: NONE**.
4. **YALL LAW → Hall of Mirrors**: Inspect mirror number `5000000`. Confirm that it resolves as a **logical virtual identifier**, not an actual running proxy.
5. **YALL LAW → Evidence Logging**: Verify the ledger. Enter a test 12+ character export password and tap **Export Encrypted Ledger (phone)**. Select the downloaded JSON file under **Verify Portable Evidence File** and verify with the same password. Separately use **YULL LAW → Homes in Harmony → Export Backup**.

Once installed on a valid HTTPS origin, try airplane mode, reopen the Home Screen app and repeat the offline note / 4T / evidence checks. Voice recording requires explicit permission, microphone availability and compliance with recording-consent laws; it is intentionally not part of automatic tests.

## What is genuinely active

- Responsive mobile YULL / 4T / YALL chambers.
- Device-local browser storage, AES-256-GCM encrypted record **contents**, password-derived encryption key, and a user-initiated vault lock.
- SHA-256 hash-linked application event log and verification.
- Client-side password-encrypted evidence JSON export/verify (no PDF service necessary).
- Manual browser backup of already-encrypted records; **some metadata and the audit ledger in the general backup are not encrypted**.
- Model of 5,000,000 logical mirror identifiers, a manual text-check rule simulator, and optional microphone capture.
- App icon, install manifest, offline shell for HTTPS deployment.

## Not yet active

- An installed app on your phone (that requires your device and/or deployment action).
- Live network firewall, five million actual proxy servers, WireGuard tunnels, real-time E2EE messaging, cloud sync or automated off-device backups.
- PDF export from a static HTTPS host (encrypted PDF export remains optional via `server.py` on a trusted **loopback-only** computer).
- Independent penetration testing, secure code signing or App Store / Play Store publication.

**Treat this as a functional prototype using disposable test data until you complete a device test and a security review.** Browser storage can be lost, passphrases cannot be recovered, and local files or databases may be deleted by the browser/OS. Preserve backups separately.

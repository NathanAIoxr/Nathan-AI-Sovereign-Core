# SSS-CS — Native iOS IPA Build Package

**SSS** = Simply Sensational Software · **CS** = Clause Santa.  
**YULL LAW** = Christmas Spirit · **4T Engine** = Torrent / Terraces / Tunnels / Terminal · **YALL LAW** = Christmas Ghost.

## Important: What is in this ZIP

This ZIP is an **Xcode iOS app project**, including source code, the entire offline web interface, original supplied artwork and a macOS build script. **It is NOT an IPA yet.** Linux cannot run Apple's Xcode/iPhoneOS toolchain, and no Apple signing credentials were available here. Do not rename this ZIP to `.ipa`; that would not create an installable app.

### Fastest way to produce a real unsigned IPA (without owning a Mac)

1. Upload **the files in this folder** to a repository in your GitHub account that you choose. **A public repository publishes the app code and artwork**, so use a private repository if you want to keep those files private. Never upload private vault records or passwords.
2. In GitHub, select **Actions → SSS-CS unsigned iPhone IPA → Run workflow**.
3. After a successful run, open the run and download the **SSS-CS-UNSIGNED-IPA** artifact, then unzip that artifact to retrieve `SSS-CS-UNSIGNED.ipa`.
4. If you use Sideloadly on Windows, feed it `SSS-CS-UNSIGNED.ipa`, select your phone/Apple signing account, and let it sign and install. Confirm the software meets the sideloading tool's current requirements.

**The CI build has not yet run.** Building in macOS CI may reveal issues that require adjustment. The actual IPA and iPhone installation must be validated.

### If you have a Mac

1. Install a compatible version of Xcode and open `SSSCS.xcodeproj`.
2. Select the `SSSCS` scheme, connect your iPhone and choose your Apple Development Team under **Signing & Capabilities**. Use **Run** for the quickest on-device test.
3. For an unsigned IPA to use with Sideloadly, run `bash build_unsigned_ipa.sh` in Terminal. Output: `dist/SSS-CS-UNSIGNED.ipa`.
4. For a signed distributable IPA, use Xcode Product → Archive → Distribute App, selecting the appropriate account, device registration and signing method.

### What this native wrapper does

- Bundles the original SSS-CS visuals, 3 chambers and 4T registers for **offline, on-device use** without web hosting.
- Runs the original Manor Vault (PBKDF2 + AES-256-GCM encrypted content), evidence ledger and password-encrypted JSON evidence export inside a persistent WKWebView store.
- Uses iOS Files export picker instead of a browser download for app-generated exports up to 25 MB.
- Shows a native-mode status in the existing Phone Test Lab.
- Never transmits automatic telemetry; restricts WebView navigation to the bundled `Web/` directory. Uses no external CDN.
- Voice Box needs user microphone permission and device testing. Cloud sync, VPN, realtime messaging, true network firewall and physical proxies are **not implemented**. Five million mirrors remain *logical model identifiers*.

### Known platform behavior requiring an iPhone test

- WebCrypto `crypto.subtle` and IndexedDB must be verified from the iOS WKWebView `file://` origin using **Phone Test Lab** before saving important data. The standards recognize local files as potentially trustworthy origins, but individual WebKit versions may behave differently.
- The service-worker install test is intentionally skipped: the UI is bundled for offline use.
- The desktop Python PDF service is not bundled; **encrypted evidence JSON works locally** (native Files export).
- Reinstalling / uninstalling can delete local browser storage. Preserve exported backups and passwords separately.
- This wrapper has not been compiled by Xcode or run on an iPhone in this environment. Use disposable test records until verified.

### Source / layout

`SSSCS.xcodeproj/` native app project, `SSSCS/*.swift` native wrapper, `SSSCS/Web/` all local assets, `SSSCS/Assets.xcassets/` iOS icons, `build_unsigned_ipa.sh` compiler/package script, `.github/workflows/build-ios-ipa.yml` optional macOS cloud build recipe.

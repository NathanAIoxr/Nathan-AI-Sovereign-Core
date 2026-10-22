# SSS-CS — The Super Supper Symbiotic Computer System

**SSS = Simply Sensational Software · CS = Clause Santa.**

A local-first virtual computer app belonging to the ONE — The Last App ecosystem. Its three operating chambers are:

- **YULL LAW OS** — Christmas Spirit, hospitality, chats, notes, archives, the encrypted Manor Vault, library, family photo archives.
- **4T Engine** — Torrent, Terraces, Tunnels, Terminal; axioms `1+1=2` (to build), `1-1=0` (to protect).
- **YALL LAW OS** — Christmas Ghost, security rule-check demonstrations, tamper-evident evidence logs, archive protection and 5,000,000 **logical** mirror IDs.

## Get the iPhone IPA

After a commit to `main` affecting `app-factory/sss-cs/**`, the [SSS-CS unsigned iPhone IPA](../../.github/workflows/ios-sss-cs-ipa.yml) workflow builds the bundled offline app on an Apple-hosted macOS runner. Open **Actions → SSS-CS unsigned iPhone IPA** to find run artifacts. If the release job succeeds, a direct unsigned IPA is also published as a GitHub Release asset.

The IPA is unsigned. Use a supported signing/provisioning process (e.g. Sideloadly on a computer) before installing on a personal iPhone. iPhone behavior, microphone permission and WKWebView local encryption need device validation.

## Local web/PDF test server

Requires Python and `pip install -r local-server/requirements.txt`. Run:

```bash
python local-server/server.py
```

Then open `http://127.0.0.1:8765`. The computer server supports password-protected PDF evidence reports, while the packaged phone app can export locally encrypted evidence JSON.

## Boundaries

- The SSS-CS interface, icons, supplied artwork, iOS wrapper, local vault and optional local server are included as **source** in this folder.
- **Not real network security:** mirrors are logical model identities. No 5,000,000 running proxies, deployed VPN, device firewall, intrusion monitor, real-time chat, or automatic cloud synchronization.
- **Privacy:** personal vault backups, real recordings, passwords, tokens, signing credentials, and private data are not part of the public source tree.
- The original source and deployment details are in `ios/README_FIRST.md`, `PHONE_START_HERE.md`, and `TEST_RESULTS.md`.

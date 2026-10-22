# SSS-CS Phone Test v2 — Build Validation

These checks were run on the project files and local desktop PDF endpoint, **not** on a physical phone.

| Check | Result | Detail |
|---|---|---|
| localhost static index.html | PASS | 200 / 9348 |
| localhost static app.js | PASS | 200 / 46411 |
| localhost static styles.css | PASS | 200 / 14621 |
| localhost static sw.js | PASS | 200 / 720 |
| localhost static manifest.webmanifest | PASS | 200 / 614 |
| localhost static assets/ssscs-art.webp | PASS | 200 / 442778 |
| localhost static assets/icon-192.png | PASS | 200 / 3898 |
| localhost static assets/icon-512.png | PASS | 200 / 11383 |
| controls mounted | PASS | phone-setup-btn,phone-install-btn,module-dialog,dialog-status,chamber-slider,handshake-btn,guardian-state,archive-count,evidence-count |
| three chambers | PASS |  |
| standalone install manifest | PASS |  |
| offline shell asset list | PASS |  |
| local encryption & portable audit | PASS |  |
| 5,000,000 logical mirrors without proxies | PASS |  |
| content not logged in plaintext from Ghost input | PASS |  |
| app not sending third-party requests | PASS |  |
| PDF report endpoint | PASS | 200 / 3752 |
| PDF AES encrypted | PASS |  |
| PDF rejects wrong password | PASS |  |
| PDF decrypts with correct password | PASS |  |
| PDF contains event entries | PASS |  |
| tampered ledger rejected | PASS | {"error": "Hash mismatch at entry 2."} |

**22/22 static and backend checks passed.**

JavaScript syntax was checked with Node. An interactive Chromium phone-emulation test was attempted, but this runtime has a managed `URLBlocklist` that blocks all page navigations. Thus phone UI interaction, WebCrypto inside a real browser, service-worker offline operation, and real iOS/Android installation remain **untested on-device**.

# NATHAN AI 🚀 — SOVEREIGN DEFENDER

**Program family:** Viruses · Ransomware · Antivirus · Hack · Dehack · Original Preservation  
**Creator-original attribution:** Nathan Tabor  
**Source status:** Owner-local read-only triage, SHA-256 integrity comparison and inert ransomware exercises. This is **not** full endpoint antivirus, ransomware removal, a live firewall, an intrusion platform or a deployed malware sample.

[Consumer browser edition](./index.html) · [Seven-family development register](./family.json) · [Hall of Mirrors original](../../one/hall-of-mirrors/) · [Five Equal Guardians](../five-guardians/) · [ONE Offloader](../../one/offloader/) · [All programs](../program-jobs/)

## What is implemented

| Job | Working feature | Evidence boundary |
|---|---|---|
| Virus / antivirus-style triage | Read-only file SHA-256 and benign test-file fingerprint; original Hall of Mirrors text rule signals | A suspicious indicator is a review prompt, and no indicator is **not** proof of safety |
| Ransomware review | In-memory synthetic rename/change/backup-unavailable events and repeatable mock alert | No real encryption, deletion, execution or detection of active ransomware |
| Dehack / incident response | Owner-local triage, source-preserving incident checklist, links to original Five Equal Guardians policy preview | Does not autonomously disconnect, block, access or retaliate against any network/endpoint |
| Original integrity | Export a SHA-256 baseline and compare against another owner-selected snapshot | A hash manifest is not an offline backup |
| Consumer | Responsive local browser with file selection, SHA-256, exact source status and clearly scoped controls | The browser cannot examine every file/device or act as installed antivirus |
| Ubuntu / Docker | `audit.cjs` runs the existing Hall of Mirrors bounded scanner and outputs metadata-only JSON | Runs only with explicit absolute owner directory; no write, remote scan or credential access |
| Recovery | CISA/FBI-based evidence and original preservation checklist | Actual incident recovery requires clean backups, an authorized operator, and independent testing |

### Scan a chosen Ubuntu/Docker directory

From the repository root on **your own device**:

```bash
node app-factory/nathan-ai/sovereign-defender/audit.cjs --dir /absolute/owner/selected/folder
```

To retain the current baseline for later comparison, redirect output to a **private file outside the scanned directory**; source paths and digests may reveal sensitive information:

```bash
node app-factory/nathan-ai/sovereign-defender/audit.cjs --dir /absolute/owner/selected/folder > /private/location/defender-baseline.json
```

Later compare the current state with the previous report (or its `baseline` member):

```bash
node app-factory/nathan-ai/sovereign-defender/audit.cjs --dir /absolute/owner/selected/folder --baseline /private/location/defender-baseline.json
```

Run the **fictional**, non-executing ransomware exercise:

```bash
node app-factory/nathan-ai/sovereign-defender/audit.cjs --exercise
```

The CLI intentionally reuses the preserved original Hall of Mirrors scanner. Default scan bounds: 512 records, five nested directory levels, up to 256 KiB per supported text file, and 8 MiB total readable content. Unsupported, larger, changed or symlink targets are reported as **skipped**, not treated as malware-free. No file modifications, uploads, remote probes, quarantine or malware execution occur.

### Browser version

Serve the repository, then open `http://localhost:8765/app-factory/nathan-ai/sovereign-defender/` or use the published relative route on GitHub Pages after its deployment.

The browser asks you to select individual files, up to 24 with a 1 MiB per-file limit, and performs local SHA-256 with WebCrypto. Local text matching reuses the original Hall engine and its rule list. It offers an explicit baseline download, optional comparison and harmless fake ransomware activity display. **It does not request folder permissions, launch malware, synchronize files, or upload private originals.**

## Author's historical source programs

The creator's original titles and names remain in the [seven-family register](./family.json). Existing historical references include **Hack D Hack / Glyphstream**, **GUARDRAILAI**, **Shadow Shield Phase Mirror**, **Trinity of Snow**, **Five Equal Guardians**, **Hall of Mirrors**, **Sovereign Command Encryption**, and the original virus/ransomware/dehack scenario names. Some have source; others have only catalog records or creator-supplied simulations. Do not convert a named simulation into a "completed production antivirus" claim.

## Safe test scope and notices

- The known EICAR SHA-256 fingerprint is recognized as a **harmless antivirus test artifact**. Detection does not make this a malware engine. EICAR recommends using its benign test file instead of real viruses during validation.
- This code never **builds** a virus, worm, trojan, ransomware encryptor, exploit chain, credential extractor, intrusion bypass, unauthorized scanner, stealth module or remote counterattack.
- The ransomware exercise accepts only fictional event objects and reports an alert. No real file is encrypted, renamed, deleted or held for payment.
- The quality suite confirms state handling, safe paths, EICAR fingerprint, baseline verification, immutable originals and local boundary enforcement, not production detection accuracy.
- When a real incident occurs: preserve records and known-good original files, use qualified and authorized response assistance, isolate appropriately, test offline backups, restore to a verified clean system, and document results.

## Source and operating guidance

- [CISA 2025 StopRansomware Guide](https://www.cisa.gov/sites/default/files/2025-03/StopRansomware-Guide%20508.pdf): offline/immutable backups and regularly tested recovery.
- [FBI — Ten Actions to Improve Cyber Resiliency](https://www.fbi.gov/investigate/cyber/ten-actions-to-improve-cyber-resiliency): 3-2-1 offline backups, secure administration and response planning.
- [EICAR — harmless anti-malware test](https://www.eicar.org/download-anti-malware-testfile/).
- [NIST Cybersecurity](https://csrc.nist.gov/): guidance and standards; this product is not NIST-certified.
- [YARA-X official documentation](https://virustotal.github.io/yara-x/docs/): reference for a possible later **licensed, user-authorized** static scanning engine integration. No YARA-X engine has been bundled yet.

## Tests

```bash
node --test app-factory/nathan-ai/sovereign-defender/engine.test.cjs
node --test app-factory/nathan-ai/sovereign-defender/audit.test.cjs
node --test app-factory/nathan-ai/sovereign-defender/browser.test.cjs
```

`1+1=2` — **BUILD** real tested owner-authorized defenses.  
`1-1=0` — **CLEAR** a simulated state when explicitly requested.  
**PRESERVE:** Original source, version history, project labels, access boundaries and restore evidence.

# Security and enforcement model

## Implemented in the prototype

- Local-only data, no external script, fonts, trackers, analytics or network calls.
- Image upload accepts PNG/JPEG/WebP and re-encodes it as resized JPEG to avoid embedding active SVG payloads.
- Imported projects are validated and display content using DOM `textContent`; standalone HTML uses escaped text and allowlisted colors/data URLs.
- Local SHA-256 hashes and comparisons run in browser Web Crypto.
- Evidence log consists only of user-provided incident descriptions/URLs.
- External launcher URLs allow only HTTP(S) and open in new tabs with `noopener,noreferrer`.

## Current limitations

1. **Local storage is not encrypted.** It is available to the browser profile and can be lost upon clearing site data. Avoid shared/untrusted devices for sensitive memories.
2. **SHA-256 matches only identical bytes.** It does not match recompressed video frames, crops, screenshots or synthetic face swaps.
3. **No global or dark-web scanner.** Private, encrypted and Tor-hosted resources are not accessible to a standard client scanner. Public-site search is not implemented.
4. **No remote erase or retaliation.** You cannot grant a local app universal deletion rights over files hosted by others. Takedowns must go through authorized provider APIs, platform reporting channels and legal processes.
5. **Email attachments are manual.** `mailto:` creates a draft, not an attachment; rendered HTML in email clients is inconsistent.
6. **No zero-knowledge guarantee or immutable ledger.** Local hashes are not proof of copyright, consent or authorship.

## Safe path to production

- Authenticate user, add explicit permissions, per-asset consent records, end-to-end encryption for cloud sync, recovery/backup, structured audit logs and accessibility.
- Opt-in, rate-limited scanning of **authorized/public** sources through platform-approved APIs or search indexes; queue candidates, review false positives, record exact URLs and timestamps.
- Optional perceptual hash for image similarity and separately consented biometric detection with strong privacy impact assessment. Never treat a score as proof of identity or wrongdoing.
- Provider-specific report templates, copyright/privacy appeal workflows, human reviewer escalation and links to relevant rules.
- Rate limits, HTTPS, secret-management, independent threat-model review and robust test coverage before accepting network uploads or automated claims.

**Do not implement exploit-driven takedown, forced remote deletion, CDN corruption, dark-web intrusion or denial of service.** Such actions are neither technically assured nor authorized merely because an asset is yours.

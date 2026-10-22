# ONE — Lean Cloud (owner-controlled encrypted original archive)

One existing ONE app, one small API, one HTTPS gateway, one private storage volume. **No ERP, office suite, CRM, PostgreSQL, Kubernetes, AI token billing, third-party history scraping, or API keys in the public client.** This is an implementable, *single-owner preview*, not a claim of full production compliance.

## What works in this branch

- Existing SEALED VOICE BOX locally encrypts the exact authored originals and their metadata.
- Owner presses **Encrypt, Upload & Verify** on their phone. The browser produces the same end-to-end AES-GCM encrypted `.onevault` archive as its existing offline backup.
- Browser computes a SHA-256 checksum, sends ciphertext over owner-configured HTTPS to a private ONE API, and supplies a transient owner credential. No passphrase or plaintext travels to the API.
- Server authenticates the owner, restricts browser origins, rejects non-vault uploads and incorrect hashes, limits body size, stores ciphertext under a SHA-256 content-addressed filename with secure file permissions, and responds with an exact receipt.
- Browser **downloads the same archived bytes again** and compares its checksum before showing **CLOUD VERIFIED**.
- The owner can list encrypted cloud backups and download a hash-verified .onevault to Files, then restore it with their private passphrase in the existing ONE UI. Redundant uploads return a stable ID without adding another original.
- A separate hardening fix prevents locking the vault while a voice note is still recording or finishing its save.

**Not implemented:** an externally running server, automatic background capture or synchronization, provider account history permissions, independent backup replication, per-device revocation, multi-user tenancy, passkeys/OIDC, full chunked resumable files, push notifications, browser background persistence or a native App Store release. Server ACK is **not** proof of an independent backup. No compliance certificate or 100% reliability is asserted.

## Deployment on an owner-controlled Linux server

Requires owner-controlled HTTPS domain pointed by DNS to an accessible private Linux host with Docker Compose; TCP 80 and 443 open, adequate durable disk. A private cloud hosting subscription and domain registration may cost money even if the code uses open-source components.

1. Copy this **lean-cloud/** directory (never private source data) to the host.
2. Run `cp .env.example .env`. Set `ONE_DOMAIN` to a real domain (no scheme), `ONE_ALLOWED_ORIGINS=https://nathanaioxr.github.io`, and generate a unique owner secret using `openssl rand -hex 32`. Keep `.env` private with `chmod 600 .env`; never commit it.
3. From the directory run `docker compose -f compose.yaml config` to validate, then `docker compose -f compose.yaml up --build -d`.
4. Test `curl https://YOUR-DOMAIN/healthz` and confirm HTTPS and the result `backup_verified:false`.
5. Open existing ONE / SEALED VOICE BOX on your phone, unlock its local archive, enter `https://YOUR-DOMAIN` and the private owner credential, then tap **Encrypt, Upload & Verify**. Do not use a shared/public phone for the owner credential. The client keeps it in the current input field only; locking clears it.
6. Verify **List Cloud Backups** and **Download & Verify** on another authorized device; use the original passphrase to restore the downloaded encrypted file. For real data, create and test a second independent backup copy first.

The server contains **only encrypted vault archives** with unknown underlying original content. This is why PostgreSQL is not necessary in the first stage. Later, searchable multi-device records, ACLs and project-level sync can be added under the same ONE interface using PostgreSQL and proper device-level authentication.

### Security and recovery requirements before production

- Protect and rotate the strong owner credential; replace shared bearer authentication with device-bound passkeys/OIDC before multi-user deployment. A server-side bearer secret is a technical authentication credential, not an AI usage token.
- Add rate limiting at the gateway, strict resource quotas, detailed but redacted audit logs, security patch automation, and container image digest pinning. Caddy automatically provisions TLS only once domain and network prerequisites are met.
- Run backup jobs to **independent** offsite, versioned storage with separate access credentials and regular restore drills. Current named Docker volumes and encrypted cloud copies alone are not disaster recovery.
- Encrypt host volumes or enforce physical disk protections, verify owner recovery passphrase handling, log scrubbing, infrastructure health alerts, access reviews and jurisdiction-specific privacy obligations. Client-side AES-GCM protects archive contents but does not erase cloud traffic metadata.
- Test browsers, iOS/Android, large archives, offline retries, storage exhaustion, concurrent uploads and interrupted transfers before release.
- The client verifies content integrity; it does not validate the authenticity of an unknown third-party-generated .onevault until it decrypts and restores it. Never copy arbitrary secrets to a public repository.

## Testing

```
node --test app-factory/one/lean-cloud/server.test.cjs
node --test app-factory/one/offloader/engine.test.cjs
```

ONE invariants: **CREATE ONCE · TRANSFORM INTO EVERYTHING · PRESERVE THE ORIGINAL.** **1+1=2 / 1−1=0.** **YES is YES / NO is NO.**

**YULL LAW:** give, organize, preserve. **YALL LAW:** guard, verify, recover. **Hall of Mirrors:** defensive logical decoys, not fictitious claims of millions of live cloud instances.

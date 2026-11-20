# Nathan AI Security — External Quarantine Box
Independent defensive security project for the Sovereign Conductor, Sovereign Multi-Axis Lab, original 21-coin registry, Tabor Bank of 69, and holding vault. Does not combine those projects or alter their original source.

## Perimeter
1. Cloudflare WAF/Access and authentication remain the first line of defense (configure in dashboard after verifying actual zones and entitlements).
2. The defensive guard evaluates request metadata for protected paths, repeated authentication failures, and rate thresholds.
3. Decisions: ALLOW, CHALLENGE, DENY, QUARANTINE. Quarantine is an application-level reject-and-record state, **not** a honeypot, physical sandbox, or a claim that an attacker was captured.
4. Store minimal event metadata in D1; never store tokens, passwords, raw request bodies, or wallet keys. Retain only what is needed for incident response.
5. Incident response: revoke affected credentials, isolate affected resources, preserve logs, notify provider, and report credible incidents through lawful channels. Never perform retaliatory intrusion.

## Boundaries
No attribution from IP alone. No hacking back. No mass external scanning. No claims of real-time protection until WAF/Access, Worker route, and event sink are bound and tested. Default HOLD for new enforcement.

## Test
`node --test src/guard.test.mjs`

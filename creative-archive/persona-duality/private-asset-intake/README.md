# PD-003 — Buddy Boo / Hunny Zoo private asset intake

This is an **intake and verification utility**, not an asset recovery claim. A complete read of the public GitHub main tree on November 18, 2026 found **no paths named Buddy Boo, Hunny Zoo or Hidden Kingdom**. That does not establish whether originals exist in private repositories, conversations, personal devices, or other owner-controlled stores.

The source registry already identifies Buddy Boo (`buddy`) and Hunny Zoo (`hunny`) as separate original German Shepherd mystery-investigator characters, with `hidden-kingdom` as their creative world. DOG AI is a distinct software role and is not automatically the same character.

## Process

1. Inventory only materials supplied or explicitly authorized by the creator in an approved **private vault**. Do not scan third-party services, scrape private inboxes, or copy third-party artwork.
2. Compute SHA-256 locally from actual bytes. The intake utility only accepts metadata; it never downloads, uploads, stores, or publishes original bytes.
3. Classify each asset as `creator_original`, `licensed`, `third_party_reference`, or `unresolved`; preserve original names, dates, spellings and creator-supplied wording in the private archive.
4. Record `unverified` initially. Promote to `owner_verified` only after comparing with owner-supplied originals; use `rights_reviewed` only after rights checks.
5. Store the full manifest privately. Only `publicInventorySummary` output (counts and explicit non-verified status) may be used in public dashboards. Never publish vault keys, hashes, filenames, source text or unreleased artwork.
6. Keep the PD-003 backlog task **pending** until actual originals are supplied, verified, and privately preserved. This code does not satisfy asset restoration.

## Tests

`node --test creative-archive/persona-duality/private-asset-intake/intake.test.mjs`

This module is additive and imports only the existing public Persona Atlas node registry. It does not change Cloudflare deployment, the Santa Factory, MAS SPIRIT canon, or Tabor Train.

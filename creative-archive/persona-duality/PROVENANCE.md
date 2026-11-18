# PD-002 — Persona provenance and chronology audit

This is a **source inventory**, not a reconstructed historical timeline. The dates attached to the November 13–18, 2026 repository records describe document or canon versions; they are **not** invented dates of Nathan Tabor's original utterances or character creations.

The JSON ledger records ten claims with typed evidence, source paths, authorship classes, uncertainties, and five unresolved primary-source questions. Santa Claus, The Reaper, Isaiah 45:7 (KJV), yin and yang, White Dog/Black Dog, Buddy Boo/Hunny Zoo, HH Lifestyle, the Santa Factory, the Tabor Train, and MAS SPIRIT remain distinct. All direct-quote fields are null until the exact originating author wording is verified.

The existing MAS SPIRIT canon and the pending PD-001 spelling crosswalk are unchanged. In particular, SUPMALG/SUPMALS must not be silently normalized. No private files or unpublished artwork are included. This is not a claim of independently functioning AI personas.

Run `node --test creative-archive/persona-duality/provenance-ledger.test.mjs`. The JSON can be ingested by a later reviewed Atlas API update; this PR intentionally does not alter the deployed Cloudflare Worker or its cron.

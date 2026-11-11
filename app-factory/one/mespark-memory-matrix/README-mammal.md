# MAMMAL — 1985 Historical Registry and Then & Now Conversion Engine

Additive module for meSPARK / Nathan AI ONE. Historical places and road names can have multiple aliases and dated identity claims. The engine keeps an original recollection separate from subsequent records and independent evidence.

## Run
Open [mammal-then-now.html](./mammal-then-now.html) in a browser. Search original and later road names, filter record types, inspect evidence, add/edit records, and export/import JSON. It works offline and stores edits in this browser only. There is no server sync or current-resident tracking.

## Historical frame
The author's stated departure boundary is **1985**. Records describe places *through that period*, not current residents. Road and postal changes may be dated later, without altering original wording. User-supplied historical identifiers are not automatically confirmed by the app.

## Road identity dispute
A past draft asserted that **Old Highway 431 was entirely renamed County Highway 28**. That assertion is **not established** by the presented evidence; Madison County still uses the name Old Highway 431. The comparison is retained as a claim marked **conflicting evidence** rather than asserted as a verified whole-road conversion.

## Database
- [schema-mammal.sql](./schema-mammal.sql) is an **optional, unapplied PostgreSQL migration**. It adds historical records, citations, an audit log, and restrictive row-level security defaults.
- Airtable **NATHAN AI — ONE MASTER INDEX** is the source catalog / research crosswalk. It is **not** a live bidirectional sync for the HTML app.
- Privacy: no family addresses, historical private phone numbers, or identifiable third-party residence histories are committed to this public repository. Private data remains in the owner's local downloaded historical file unless separately imported into an access-controlled backend.
- This module is additive; preserve existing meSPARK code and original source records without rewriting them.

## Other author materials
The supporting archive also includes an Alabama Devil Dog chronology, family/landmark narratives, and an exploratory Zoonomia fixed-step WIG parser. Treat these as distinct research/story modules. The complete private pasted source text has **not** been published into this public project; provenance and privacy review are required before any source-level public release.

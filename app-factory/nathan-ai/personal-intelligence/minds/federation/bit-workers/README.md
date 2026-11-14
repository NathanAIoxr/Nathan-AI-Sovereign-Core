# NATHAN AI — EVERY 0 AND 1 A WORKER · ONE Federation v074

**By Nathan Tabor · November 13, 2026**

**Exact author request:** "make each 0 and 1 in my database an AI worker bot based on Nathan Tabor - this insures and ensures soverignty"

This implementation gives **every individual bit of the exact UTF-8 source text in federation_records** a deterministic, addressable, virtual Nathan AI worker identity. There are exactly 8 × UTF-8 byte length logical worker addresses per record revision. A worker is resolved on demand, with no per-bit SQLite rows, OS processes, or independently billed model sessions.

It is **operational owner control inside this component**, not independent consciousness, billions of running models, or a guarantee of absolute sovereignty against actors with direct database access.

## ZERO and ONE are equally protected workers

| Bit | Worker role | Practical task |
|---|---|---|
| **0** | ZERO / guard-and-hold | Inspect provenance, hold unsafe or unauthorized requests |
| **1** | ONE / propose-and-build | Inspect provenance, suggest authorized constructive changes |
| **Both** | ONE equal-standing rule | No unilateral edits, deletions, exports, external calls or permissions |

**A bit value is not consent.** The owner veto and action-authorization gate apply equally to both bits. A ZERO may receive an owner grant; a ONE may be denied.

Every worker ID is bound to source ID, record ID, original full SHA-256, and bit offset (MSB first). A revised source gets different worker addresses without changing earlier records. A Unicode character may span multiple UTF-8 bytes.

## Install in the EXISTING private ONE master

The module adds only three control/audit tables to the existing master. It does not duplicate federation source records or build a competing database, and refuses to create a missing master.

~~~sh
F=app-factory/nathan-ai/personal-intelligence/minds/federation
DB=/private/path/ONE_Federation_Master.sqlite3

python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" init
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" status
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" audit-bits
~~~

**status** counts all addressable bit workers lazily. **audit-bits** verifies all source SHA-256 hashes and gives exact ZERO and ONE totals. The reported private v074 37,342-record count is not a bit count; only an actual local scan can establish a total.

To identify a source ID, record ID and full content SHA-256 without printing text:

~~~sh
python3 - "$DB" <<'PY'
import sqlite3,sys
con=sqlite3.connect(f"file:{sys.argv[1]}?mode=ro",uri=True)
print(con.execute("SELECT source_id,record_id,content_sha256 FROM federation_records LIMIT 1").fetchone())
con.close()
PY
~~~

Then use these exact identifiers:

~~~sh
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" inspect \
  --source SOURCE_ID --record RECORD_ID --sha256 FULL_SHA256 --bit-index 0
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" propose \
  --source SOURCE_ID --record RECORD_ID --sha256 FULL_SHA256 --bit-index 0
~~~

These commands read a bit and give a role/proposal, not source text or an autonomous model result.

## Owner control and explicit veto

~~~sh
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" pause
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" resume
~~~

Pause immediately denies proposed action and grant handoff through this module. Read-only inspection remains possible. The local OS and filesystem permissions are the **real trust root**: direct SQLite writers with unrestricted access can bypass these software checks. Keep the master private, owner-permissioned, backed up and appropriately encrypted.

A short-lived **HMAC-SHA256 grant** can be issued locally for one worker ID, one proposed external action and one expiry; the authorization nonce is one-use. The owner signing secret comes from local environment variable NATHAN_ONE_OWNER_SIGNING_KEY (minimum 32 bytes), ideally loaded by a secure secret manager. Never commit, share, or expose the signing secret.

~~~sh
# Secret supplied locally by owner-controlled secure configuration.
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" grant \
  --source SOURCE_ID --record RECORD_ID --sha256 FULL_SHA256 --bit-index 0 \
  --action export --seconds 300

# Use grant token privately; CLI arguments can appear in shell logs/process lists.
python3 "$F/bit-workers/zero_one_workers.py" --db "$DB" authorize \
  --source SOURCE_ID --record RECORD_ID --sha256 FULL_SHA256 --bit-index 0 \
  --action export --token PRIVATE_GRANT
~~~

The three permissioned action labels are database_write, external_call and export.

**Even a successful grant does not execute anything.** This module has no external executor or connector. It records an authenticated *handoff eligibility* for a future separately reviewed adapter. Such an adapter is not installed, and would need to re-enforce owner veto before any effect.

## Every physical 0 and 1 in a consistent PRIVATE database snapshot

The separate [full-SQLite snapshot worker module](./database_bit_snapshot.py) also covers **every byte, 0 and 1, of a consistent private SQLite snapshot**, including page metadata, indexes, stored BLOBs and rows not yet imported into federation_records. It uses SQLite's backup API to create a new copy; it refuses to overwrite an existing file or put a private snapshot in a directory with group/world access.

~~~sh
# Owner-only private directory (0700), not inside a public repository!
mkdir -p "$HOME/private-one-snapshots"
chmod 700 "$HOME/private-one-snapshots"
python3 "$F/bit-workers/database_bit_snapshot.py" --db "$DB" capture \
  --output "$HOME/private-one-snapshots/ONE_snapshot_v074.sqlite3"
python3 "$F/bit-workers/database_bit_snapshot.py" --db "$DB" status

# Use snapshot_sha256 printed by capture. This audits EVERY raw bit in the copy.
python3 "$F/bit-workers/database_bit_snapshot.py" --db "$DB" audit \
  --snapshot-sha256 SNAPSHOT_SHA256
python3 "$F/bit-workers/database_bit_snapshot.py" --db "$DB" inspect \
  --snapshot-sha256 SNAPSHOT_SHA256 --bit-index 0
~~~

Every snapshot bit is a stable, on-demand NT01-FILE identity, with the same ZERO/ONE role and owner veto policy. **A snapshot is not a continuously synchronized live file**; every subsequent database revision requires a new explicit snapshot for byte-level coverage. There are no physical per-bit worker processes, just addressable virtual identities.

Do not sum the bit count from the raw snapshot with the source-text bit count: the latter is included within the former as stored data. The private SQLite source is never uploaded to public GitHub.

## Honest coverage boundary

- **Included:** every original 0 or 1 bit in the exact UTF-8 source text of EVERY already-indexed federation_records revision, with stable on-demand identity.
- **Source-text coverage:** includes only indexed federation_records UTF-8 content. **Optional physical snapshot coverage:** includes ALL bits stored in that explicit consistent SQLite backup, including raw pages, indexes and BLOBs. It does not imply that a live changing database, unconnected external databases, machine RAM or unbacked-up private Memory History sources are synchronized.
- **Source preservation:** no original content changed by inspecting or auditing. CERO / UNO / DOS tiers remain unchanged; no derived claim is promoted to evidence.
- **Privacy:** only test fixtures enter public GitHub CI; the private master never does.
- **Runtime:** no per-bit LLM instance or model inference has been activated. Worker roles and decisions are deterministic and bounded.

~~~sh
python3 -m unittest discover -s "$F/bit-workers" -p 'test_*.py' -v
~~~

**YES IS YES — NO IS NO.**

**PRESERVE → INDEX → RELATE → DERIVE — NEVER REPLACE.**

**Formal invariants:** Original text is unchanged; owner veto takes precedence; a bit's value is NEVER a substitute for consent.

# All Roads Lead to Sovereignty · Archive build-out
By Nathan Tabor

## Source architecture and counts

The attachment combines an 18-layer heading with 17 named Trilingual Command Hierarchy rows. The 17 named rows are implemented as the matrix in `data/architecture.json`. The published ACT lexicon is also 17 entries and retains its own script, opcode, seal and alternate-name fields. A source-defined eighteenth row can be added as an editorial revision when its office, root terms, opcode and invariants are recoverable.

| Register | Current coverage | Operating meaning |
| --- | --- | --- |
| OG-001–OG-101 | 101 upstream slots | Kernel and historical computing primitives, with original upstream statuses |
| 001–404 | 404 upstream slots | Communications, state, modules, and orchestration scope |
| 505 total | 505 distinct IDs | Snapshot from the current public Digital Edge OS, which owns those execution contracts |
| ACT | 160 graph nodes and 20 original source records according to upstream | Graph identity, generation, lineage, and published source seal |
| Trilingual hierarchy | 17 named rows | Conceptual authority, existing lexicon, KJV anchors, and edge/software responsibilities |
| Cosmic Registries | 13 slots referenced | Names, source ledgers, schemas, and credentials require source recovery before activation |
| π/φ | [13, 17, 34] captioned cadence | Deterministic integer micro-unit calculation that preserves signs and 0 |
| 3, 7 and 9 | Three preservation gates, seven archive tiers, and nine proposed federation positions | Design mapping for routing, preservation, and possible future archive peers |

**Build** creates a versioned record. **Clear** rejects invalid or unauthorized input without corrupting a previous release. **Integrate** resolves canonical work, edition, and witness IDs across catalog systems. **Verify** checks evidence, byte integrity and public availability. A work revised in metadata keeps its stable ID. A reused edition ID must keep exactly its original digest.

## Rings, offices and ports

| Construct | Technical entry point | Authority and data |
| --- | --- | --- |
| Throne / King / Andúril | Release operator | Has authority to add reviewed editions and issue publication receipts |
| Envoy / Prophet / Glamdring | Discovery and ingest workflow | Collects permitted source metadata and exact files, records the evidence chain |
| Sentinel / Priest / Flaming Sword | Route method checks and operator verification | Checks rights, evidence, pinned provenance, digest and explicit release scope |
| Narya | Search parsing and intake bounds | Limits input sizes, number of search pages, origin behavior, and file bounds |
| Nenya | Content vault | Stores immutable edition bytes under content digest; segregates unpublished material |
| Vilya | Evidence evaluation | Compares independent source families, records agreement or disagreement and withholds literary certainty where witnesses diverge |
| Cair Paravel | Public Reading Room | Displays source editions, surviving evidence, and research records |
| Mithlond | Public network port | Routes HTTPS to catalog and checksum resources |
| Wardrobe | Provider adapters | Translates schema while preserving immutable source bytes and original representation |
| Morannon / Cirith Ungol | Gateway | Rejects disallowed methods, invalid filters and missing definitions |
| Wood Between the Worlds | Interoperability | Links source authorities, registry projections and provider programs |
| Stone Table / Deeper Magic | Editorial dispute resolution | Supersedes a mistaken claim with documented evidence and version history |
| Red Book / Book of Mazarbul | Hall of Records | Records editions, discovery leads, and preserved publication receipts |
| Ring 5 shell | Server-rendered Reading Room | Uses addressable links, search, filters, keyboard navigation, and no account requirement |

Keep these mappings in the author’s nomenclature. Source-language terms and KJV anchors are the project’s analogues. Modern lexicon and alternative transliterations originate in the published ACT lexicon. Bibliographic holdings originate in separately cited historical and institutional sources.

## Acquisition and restoration by vault

| Vault | Initial coverage | Work to build out |
| --- | --- | --- |
| Primeval & Scriptural | KJV source edition and source authority | Biblical edition authority tables, edition-by-edition rights, line-number concordance and facsimile links |
| Ancient World | Alexandria research, Nineveh, Gilgamesh Tablet XI, Pergamum and Ur | Cuneiform administrative joins, papyrus shelfmarks, Egyptian and Anatolian provenance and tablet-line transcription |
| Classical, Eastern & Silk Road | Nalanda, Taxila, Baghdad, Constantinople, Dunhuang and early Chinese collections | Sanskrit, Arabic, Greek, Chinese, Tibetan and Uyghur name authorities, parallel-view editions, manuscript pathways and heritage context |
| Medieval, Abbey & Desert | Timbuktu, Sinai, Cluny and the Bodleian | Multispectral undertext, institutional manuscript catalogs, folio-level evidence and conservation restrictions |
| Library of Congress & Modern Collections | All 21 subject shelves, founding collection links, map record, complete literary editions and international discovery portals | Rights-bearing item harvest, MARC/MODS mapping, linked names, edition reconciliation, historic editions and verified public copies |
| Ω Lost Works & Surviving Evidence | Sophocles dossiers, Sibylline Books research and Dresden Maya Codex witness | Passage-level attestations and manuscript images, recovery of cataloged fragments, critical editions and open lacunae |
| Public Reading Room | Browser, stable APIs, source and checksum receipts | Scholarly facsimile comparison, search across scripts, persistent citations, shelf browse and reproducible export |

The ten architecture affinity bands are A (OG-001–033), B (OG-034–067), C/D/E/F (OG-068–101), G/H (001–060), J/K (061–120), L/M/N (121–180), P (181–240), Q/R (241–300), S/T/U/V (301–360), and Z (361–404). Ω is the lost-work view and belongs to the restoration architecture. Each underlying work retains its bibliographic class.

## Pipeline contracts

1. **Discover.** Record provider identifier, URL, UTC timestamp, pagination cursor, source revision where offered, and provenance. Continue from provider checkpoints. Bound acquisition per job and pause on source throttling.
2. **Resolve.** Establish work, edition, witness, and digital object identities. Record uncontrolled aliases and confidence separately. Retain original language, script, reference and contributor role.
3. **Review rights.** Determine rights for original item, scan, transcription, translation, annotations, cover and modern edition individually. Publish links where the archive does not have permission to rehost.
4. **Capture.** Verify download format, size, checksum, expected source, and source edition identifier. Stage binary assets separately from descriptive records. Keep an original file and address OCR or accessibility derivatives as distinct assets.
5. **Compare.** Run independently attributed acquisition, witness and editorial lanes. Keep object-level corroboration and textual agreements distinct. Multiple copies of one transcription count as one source family.
6. **Publish.** Require a traceable authority for each reading and immutable digest for original or transcription. Store editions, witness records and adjudications with separate identities. Allow only published copies through the reader.
7. **Audit and recover.** Recalculate fixity. Quarantine broken pointers, replicate known-good copies under approved custody, and recover origin when a copy goes missing. Treat an unavailable source as an explicit state in the catalog.

## Infrastructure and scope

| Concern | Working release | Scale-out |
| --- | --- | --- |
| Computation | Cloudflare V8 requests, local Node operator tools | Use bounded jobs and Workers for metadata. Assign OCR, facsimile processing, and archival exports to appropriate batch compute. |
| Index | D1, parameterized catalog filters and key indexes | Add searchable derivative text and specialized catalog indexes per script and corpus size. Preserve exact edition objects separately. |
| Objects | Private R2, SHA-256 reference objects and immutable D1 publication pointers | Use manifests and versioned backups with second custody location and periodic restore drills. |
| Data movement | Explicit HTTPS reads from pinned upstream source repositories | Provider-specific groups, Cloudflare Queues, retries with bounded attempts, checkpointed Workflows |
| Coordination | Operator-controlled license and publication stages, atomic D1 publication batch | Durable Objects for per-edition workflow coordination, with independent preservation copies and restore comparison |
| Hardware | Cloudflare supplies edge CPU, memory, disks and network fabric | Scanners, conservation photography, OCR nodes, offline disks, tape replicas and geographic facilities require separate physical provisioning. |
| Repository | Nathan AI Sovereign Core stores source, tests, data fixtures and release documentation | Review provider changes, validate migration compatibility, pin source versions and publish a tested release. |

The initial corpus and archive management architecture support incremental restoration. A collection catalog linked from the archive can contain rights-limited, undigitized, unpublished, partially surviving, or historically lost holdings. The archive exposes those differences at record level.

## Expansion checkpoints

| Sequence | Build across teams | Verification |
| --- | --- | --- |
| 1. Public foundation | Reading Room, catalog, R2 fixity, archive APIs, 505/160/17 connections | Public health, record count, preserved text bytes, and independently recomputed digests |
| 2. Provenance intake | LoC item normalization, GITenberg releases, IIIF manifest and TEI artifact pilots | Provider fixture replay, repeatable source IDs, rights-state reporting, no duplicate editions |
| 3. Historical corpus | Named archive authorities, multilingual witnesses, shelfmark and folio joins | Witness-level primary links and checked support for each attribution |
| 4. Ω restoration | Passage evidence, conflicts, confidence, reviewer attestations and preserved lacunae | Citations and independent witness families for claims of restoration |
| 5. Federation | Backups, export/import, independent verification and recoverable snapshots | Full restore on separate storage, release receipt and periodic integrity audits |
| 6. Long-term access | Accessible facsimile viewer, multilingual indexing, dataset exports and versioned citations | Mobile and keyboard tests, sample monitoring by script and source, and documented offline restore |

## Source authorities

- [Library of Congress Classification Outline](https://www.loc.gov/catdir/cpso/lcco/)
- [Library of Congress APIs](https://www.loc.gov/apis/)
- [Published Digital Edge OS module registry](https://tabor-digital-edge-os.nathantaboract.workers.dev/registry/os-syscall-table.json)
- [Published ACT graph](https://tabor-digital-edge-os.nathantaboract.workers.dev/api/act)
- [Published ACT lexicon](https://sovereign-edge-os.nathantaboract.workers.dev/api/act/lexicon)
- [Library of Ashurbanipal Project](https://oracc.museum.upenn.edu/asbp/)
- [International Dunhuang Programme at BnF](https://www.bnf.fr/en/international-dunhuang-programme)
- [Sinai Palimpsests Project](https://sinaied.library.ucla.edu/)
- [HMML Global Operations: Mali](https://hmml.org/about/global-operations/mali/)
- [SLUB Dresden Maya Codex](https://www.slub-dresden.de/en/explore/manuscripts/the-dresden-maya-codex)

# Tabor World · Original Rosters and Sources

Nathan Tabor · Nathan AI

This recovery restores full records from the existing Tabor World and ONE sources. Each displayed record expands to its original data fields. The workbook, full attachment, and other owner-side originals are delivered separately in the owner's archive.

Run the public recovery in two ways from the repository root:

```sh
node --test app-factory/tabor-world-recovery/recovery.test.mjs
node app-factory/tabor-world-recovery/build.mjs --out /tmp/tabor-world-recovery.html
```

The generated HTML works offline. For the repository edition, serve the repository root over HTTP and open `/app-factory/tabor-world-recovery/`. The edge module serves the same viewer and read-only public source allowlist pinned to a Git commit. Configure `RECOVERY_COMMIT` as the deployed viewer commit.

| Evidence | Scope |
|---|---|
| Atlas | The existing World factory reconstructs all 832 rows, including 118 elements and both 101-cartridge scopes. |
| ONE and Hive | 763 Mind of Minds entries, versioned Worker Bot Families, 630 dimensional units, 333 continuity positions, 108 Tech108 roles, Creator Teams, Specialist Bees, and the 1,332/2,272 Atomic Hive version records. |
| Council and Factory | Historical figures, mythological figures, creator archetypes, numbered games and applications, source-linked mythology atlases, and Tabor Accords. |
| Federation | Four-stage architecture, five World zones, external tool names and adapter status, links to the existing Hive, Fleet, Hub and Project Runner. |

The indexed total is a sum across source editions. Repeated identities retain their original version and provenance. Historical/mythological classifications and creator-assigned roles remain in the underlying records. The Bedrock coordinate and dispatch capacities belong to a separate namespace, so a recovered name is never moved into a numbered routing slot without its source mapping.

The Cloudflare viewer performs no job dispatch or writes. The existing Hive/Fleet/Hub links lead to their own services and receipts. The worktree tests cover recovery counts, the original Atlas assembly, and the edge allowlist.

## Run minds and field devices

The Cloudflare Worker serves the live workbench at `/runtime/`. Browse versioned source collections, view the original fields, select an action, or pass the working output and scene through a sequence of two to five profile actions. Each execution returns SHA-256 fingerprints of the input and output. A sequence also returns an ordered list of the individual receipts.

The runtime reads pinned sources for attributes, characteristics, functionality, and traits. Human or fictional names are used for display and source identity. Capability cues come from the source fields and choose from a bounded set of implementations. The Archivist, for example, can restore exact supplied text. The Classifier separates marked action lines, and the Validator calculates a SHA-256 digest. Numbered Continuity, Tech108 and v75 profiles can test an ordinal against their actual family range. Evidence-bearing records can trace exact fields to their source location. Source text and runtime transformation receipts are independently inspectable.

The four field devices share a fictional scene. Grasping the Light Slayer starts a two-second window to choose a blade form. The Light Sleyer casts the web, transforms the held shadow, records dreams, and travels to an earlier scene state. The Dark Slayer retires an in-scene shadow when commanded. The Dark Sleyer spends a recovered thread to weave the sanctuary of “Innocence is God.” These are implemented scene mechanics. The workbench stores scene progress and recent receipt IDs in the browser.

`GET /api/runtime/groups`, `GET /api/runtime/roster`, and `GET /api/runtime/profile` expose the source-backed roster. `POST /api/runtime/run` and `POST /api/runtime/relay` execute the bounded functions on the Worker. SHA-256 receipts establish deterministic input and output fingerprints. They are not signatures or proof of human authorship. Remote third-party tool enrollment and owner-level permissions are separate from this workbench.

```sh
node --test app-factory/tabor-world-recovery/recovery.test.mjs app-factory/tabor-world-recovery/runtime.test.mjs
```

## Play the full Light and Dark field game

Open `/field/` for the command board, touch controls, current turn receipt and balance meter. The original profile runtime remains at `/runtime/`. The field scenarios are Cleared Sector Alpha, Dream Archive, and Matrix Crossing. They use shared board data in `field-scenarios.json`.

Grasping the hilt opens a two-second thought window. An exact form entered within that time is taken verbatim. With no thought or a delay beyond two seconds, the Light Slayer chooses from Broadblade of Truth, Rapier of Precision, and Shield-Edge using the run seed. The seed makes the same command record replayable. The Light Sleyer arms a scoped web, captures the marked shadow, and converts it into a reusable game resource until it is woven. The Dark Slayer carries out Clear Decay on the named board ruins. The Dark Sleyer consumes a recovered thread to weave an Innocence Pillar in the cleared sector. Dream Archive and Matrix Crossing add a recorded dream and a Loom rewind gate respectively.

Balance is derived from the board. Clearing the barrier adds 20 points, converting the shadow adds 30, clearing the ruins adds 20, and building the pillar adds 30. Repeating an action through a rewind restores the previous board and score. The browser keeps its move history locally. The Cloudflare endpoint replays that history to produce a board and SHA-256 receipt. It keeps no account or public score.

Run the same four classes and scenarios in a Python command loop:

```sh
python3 app-factory/tabor-world-recovery/tabor_field.py --scenario sector-alpha
node --test app-factory/tabor-world-recovery/{recovery,runtime,field}.test.mjs
```

The Worker binding `FIELD_SCENARIOS` is the JSON value in `field-scenarios.json`. The field tests cross-check Python and JavaScript outcomes for all three scenarios, the timing boundary, repeat actions, and replay receipts.

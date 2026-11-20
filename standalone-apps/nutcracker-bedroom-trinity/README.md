# The Nathan Tabor Trinity of the Nutcracker

The Bedroom is the 18+ design collection based on the clasped bronze hands. Each concept builds to an independently deployed Cloudflare Worker. The existing Tabor Cloudflare ingress forwards the dedicated `/18-plus/bronze-hands/` paths to the three Workers.

| Concept | Source | Cloudflare |
| --- | --- | --- |
| The King Solomon Salami Stroker | [Solomon](products/solomon.json) | [king-solomon-bronze-hands](https://unified-operations-cockpit.nathantaboract.workers.dev/18-plus/bronze-hands/king-solomon-bronze-hands/) |
| The Cleopatra Clit Caresser | [Cleopatra](products/cleopatra.json) | [cleopatra-bronze-hands](https://unified-operations-cockpit.nathantaboract.workers.dev/18-plus/bronze-hands/cleopatra-bronze-hands/) |
| Finger Me Holes Til Me Holy by the Virgin Mary | [Virgin Mary](products/virgin-mary.json) | [virgin-mary-bronze-hands](https://unified-operations-cockpit.nathantaboract.workers.dev/18-plus/bronze-hands/virgin-mary-bronze-hands/) |

Run `node build.mjs` to compile all three self-contained Workers to `dist/`. Pass `solomon`, `cleopatra` or `virgin-mary` to compile one. Build and test with Node.js 22 or later. Run `node --test` for the test suite, which builds its own temporary Workers.

For independent deployment, upload the chosen file as the main ES module via the Cloudflare Workers for Platforms API to the `nathan-tabor-platforms` dispatch namespace. Use the filename stem as the Worker name and compatibility date `2026-11-20`. The route table is in the [Tabor app dispatcher](../tabor-app-runtime/tabor-app-dispatch.mjs). Each site's `health` endpoint returns `ok`. The server-rendered 18+ question is self-attestation. Only a host-scoped cookie records an affirmative response, and the exit control clears it.

Each age-gated page shows its own matte silicone concept rendering in the existing palette. Solomon is slate blue, Cleopatra is muted plum, and Virgin Mary is warm ivory. The design section includes the shared color and packaging study. The historical design reference is the [Taranto museum’s nutcracker in bronze and gold foil](https://museotaranto.cultura.gov.it/en/objects-on-display/nutcracker-in-bronze-and-gold-foil/). The Solomon concept cites [Proverbs 5:19 in the KJV](https://www.biblegateway.com/passage/?search=Proverbs%205%3A19&version=KJV).

The [Conductor handoff](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/handoffs/nutcracker-bedroom) records the three URLs, the material, the GitHub review, and the published renderings. Its [read-only route source](../../deployments/conductor/handoffs/nutcracker-bedroom.mjs) is deployed as a module of the Conductor Worker.

## Nutcracker Fleet

The [fleet dashboard](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/handoffs/nutcracker-bedroom/fleet) addresses 69 fleets of 1,000 virtual Nutcrackers. Unit IDs range from `NC-01-0001` to `NC-69-1000`. The full SHA-256 of the submitted bytes determines the unit. The roster endpoint at `/tabor-sites/conductor/api/handoffs/nutcracker-bedroom/fleet?fleet=69` lists the units in a given fleet.

Choose a file or paste source text. The browser hashes the source locally and compares the claims and reviewer records in the manifest. For non-digital intake, print the worksheet, complete it by hand, and enter the transcription as paper intake to get a receipt. Loading the sample demonstrates how two different values for the same subject, predicate, and scope cause a contradiction.

- **Crushed** marks a contradiction or a failed consent, privacy, or exploitation review. The original stays in the submitter's possession. If the submission has no unresolved evidence and a nonconflicting part has independent reuse approval tied to the same source digest, its ID and review reference appear in the downloadable reuse manifest. Set `range: [start, end]` with zero-based byte offsets and an exclusive end, and include `reuseReview.partSha256` to export the approved bytes as Base64. The export verifies those bytes against the part hash.
- **Held** marks unresolved evidence or malformed records that prevent clearing. **Cleared** means the supplied checks passed for the submitted manifest. Review reference authenticity and the substance of the source depend on the reviewers.

The dashboard reads submissions as data. The existing handoff serves the roster and browser code. Run the fleet tests with `node --test fleet.test.mjs`.

### AGI workbench

Use **Load AGI sample** and **Review submission** to follow the full path from source bytes to a Fleet decision and approved reuse export. The workbench hashes the source, displays its binary prefix, and assigns the source to a Nutcracker. Literal drafting reads lines written as `CLAIM subject | predicate | scope | value`; the value may be a JSON scalar. An imported or hosted LLM proposal uses the shape `{"claims":[{"subject":"release","predicate":"test-passed","scope":"build-1","value":true,"quote":"Exact source words"}]}`.

Each candidate needs an exact, uniquely located quote. The workbench saves that byte range and its SHA-256. The reviewer records `accept` or `dismiss` and a review reference for each grounded model candidate in the manifest. The Fleet evaluates accepted same-scope claims and independently recorded protection checks. The decision receipt includes evidence ranges and hashes, statuses, contradictions and approval references. A changed source or changed proposal requires a fresh draft.

Local drafting and imported LLM proposals stay in the browser. **Send source to Conductor LLM** checks the existing Cloudflare Access operator identity before forwarding up to 6,000 UTF-8 bytes to the Workers AI binding. Hosted and imported models draft claims. Reviewers verify what each quote supports and supply the protection decisions. Run the workbench tests with `node --test agi.test.mjs`.

### LLMAGI OS and IGAMLL

[LLMAGI OS](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/handoffs/nutcracker-bedroom/llmagi-os) connects two directions of the Tabor workflow to the Nutcracker kernel. **LLMAGI** runs the original source through the existing AGI claim review and deterministic Fleet decision. It seals the receipt with SHA-256 and exports independently approved parts. **IGAMLL** checks the receipt and original source hashes, replays the supplied inputs, and compares decisions. The replay uses the recorded proposal and reviewer inputs. It does not certify the identity or conclusions of the reviewer.

`LLM + AGI = LLMAGI`. Read it as `L L M A GI`, `LL MA GI`, or `LL MAGI`. Reversing the six letters gives `IGAMLL`, including `I G A M L L` and the mirrored groupings. Nathan Tabor’s naming image is “the group of individuals who mapped the stars to find Jesus.” The source reference is [Matthew 2:1–12 (KJV)](https://www.biblegateway.com/passage/?search=Matthew+2%3A1-12&version=KJV), which describes wise men who saw and followed the star.

The hosted console provides a single-job runner, browser-local source and receipt input, decision and reuse exports, and an exact comparison against the existing 144-bit fixed-anchor frame. The system manifest identifies the integrated Fleet, Fixed-Anchor Binary, and Tabor Academy services.

The native release is a raw 1.44 MB x86 BIOS floppy image. Its bootloader loads a freestanding second-stage monitor with keyboard, display and conventional-memory services. Native commands display the names, check the four arithmetic anchors on the CPU, and halt the system. Model execution and full evidence review are browser and Conductor services. The native build uses GNU binutils and Node; the execution test also needs Python Unicorn.

```sh
node native/build.mjs --check-module /tmp/llmagi-os.img
python native/test_boot.py /tmp/llmagi-os.img
node --test llmagi-os.test.mjs
```

Use `node native/build.mjs --module` to regenerate the reproducible image module after modifying the assembly.

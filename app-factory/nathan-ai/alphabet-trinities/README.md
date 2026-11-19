# Alphabet Trinities

The A–C and G–Z material linked to The Trinity of T’s by Nathan Tabor. The site’s D–F links open their existing A–Z Archive departments. The website and products below use the same editorial corpus. The supplied A–C text, the exact Trinity of T’s line, and the T/V source excerpt are included in the Books station. The supplied wordplay and letter-history reference notes are attributed in the reader.

| Independent project | Cloudflare | Source |
| --- | --- | --- |
| Alphabet Trinities website | [Open](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/alphabet-trinities/) | [Site](public/alphabet-trinities/) |
| Alphabet Field App | [Open](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/alphabet-field-app/) | [Installable PWA](public/alphabet-field-app/) |
| Trinity Match | [Play](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/trinity-match/) | [Game](public/trinity-match/) |
| Letter Labyrinth | [Play](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/letter-labyrinth/) | [Game](public/letter-labyrinth/) |
| Alphabet Books | [Read](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/alphabet-books/) | [Five EPUBs and source texts](public/alphabet-books/) |
| Alphabet OS | [Open](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/alphabet-os/) | [Browser workspace and console](public/alphabet-os/) |
| Alphabet SDK | [Use](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/alphabet-sdk/) | [SDK and static dataset](public/alphabet-sdk/) |
| Alphabet Hardware | [Simulate](https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/alphabet-hardware/) | [Simulator, RTL, testbench](public/alphabet-hardware/) |

The website links to the existing A–Z Archive, Assessment Studio, and Sovereignty OS. Alphabet Field App keeps bookmarks and exercise notes in browser storage. Alphabet OS is a browser workspace. Alphabet Hardware includes a clocked three-bank register file and a browser simulator. A board implementation would need board-specific pin and timing constraints.

## Local usage

Run these from this directory. Node.js and Python use only their standard libraries for the project build.

```sh
node generate-pages.mjs
python3 build-books.py
node --test check.test.mjs
node build.mjs /tmp/alphabet-trinities-release
node cli.mjs T
python3 -m http.server 8080 --directory public
```

Open `http://localhost:8080/alphabet-trinities/`. The standalone pages also run on GitHub Pages under this directory’s `public/` path. The shared Nathan AI navigation is provided by the parent site.

For the RTL testbench, run the following with Icarus Verilog installed.

```sh
cd public/alphabet-hardware
iverilog -g2012 -s alphabet_registers_tb -o /tmp/alphabet-registers alphabet-registers.sv alphabet-registers-tb.sv
vvp /tmp/alphabet-registers
```

Each release file serves a distinct Worker in the existing `nathan-tabor-platforms` namespace. The cockpit gateway’s allowlist is maintained in `standalone-apps/tabor-app-runtime/tabor-app-dispatch.mjs`. The release manifest records each Worker name, origin, and content digest. The GitHub workflow rebuilds and checks the suite. With repository deploy credentials, it can publish the individual Workers and verify the live release digests.

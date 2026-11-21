# Reaper 6969 owner workspace

John Nathan Tabor's Reaper collection is available through [Tabor World Hub](https://tabor-world-hub.nathantaboract.workers.dev/reaper-6969). Cloudflare Access uses the existing Tabor owner email identity provider.

This repository contains the workbench, archive renderer, build entry point, tests and three numerical models. The detailed recovery files are owner material. The cloud deployment supplies them separately as a private Worker module, which is intentionally ignored by Git. The blueprint links in the archive point to the preserved source files.

## Routes

| Route | Purpose |
| --- | --- |
| / | Reaper workspace and navigation |
| /archive | Chronology, hardware, software, technology connections and source gaps |
| /lab | Thermal cycle, hydraulic power and rotor calculations |
| /api/lab?model=thermal | JSON output. Models are thermal, hydraulic and rotors. |
| /downloads | Recovery report, saved Python and two saved continuation texts, with checksums |
| /api/manifest | Exact GitHub revision, bundle filenames and SHA-256 |
| /healthz | Owner-authenticated deployment status |

## Test and build

Use Node 24. Run the tests from this directory.

```sh
node --test worker.test.mjs
node build.mjs /absolute/path/to/owner-archive
```

The owner archive directory holds Reaper_6969_Recovery.md, tabor_reaper.py, Reaper_6969_Sealed_Engine.txt and Reaper_6969_Knight_and_OXR.txt. The two text downloads are recovered text copies linked to their saved originals in the report. The build produces the ignored private-data.mjs file beside index.mjs.

Deploy index.mjs along with worker.mjs, lab.mjs, view.mjs, style.mjs and private-data.mjs as ES modules to the tabor-reaper-6969 Worker. Set REAPER_ACCESS_AUD to the deployed Cloudflare Access application's audience, and REAPER_GITHUB_SHA to the Git commit used for the application. Use direct invocation of the Access-protected Worker so that the Cloudflare runtime supplies the signed-in Access context. Hub navigation redirects to that Worker. Disable public preview URLs. Worker tests simulate the Access context and check that all owner routes fail closed without a matching audience.

The models use assumed inputs. They calculate ideal cycle energy, steady hydraulic power and rigid-rotor energy and angular momentum. Their outputs do not drive any device.

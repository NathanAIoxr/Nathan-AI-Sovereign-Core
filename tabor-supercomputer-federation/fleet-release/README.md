# Tabor fleet release 2026-11-18.1

This release extends the 1,000 provisioned SQLite Durable Objects in the Tabor Supercomputer Federation and the ONE Sovereign Hub. Each node stores the same versioned UTF-8 package in its existing database. ONE uses its existing D1 binding. The package is 226,828 bytes and has SHA-256 digest `02e7f1bef824a7309620d1a1cdd57af1d2c490b5e788fb590b665e17992b13e8`.

| Collection | Records |
| --- | ---: |
| Crown Master Fleet | 505 |
| Sovereign Edge OS | 505 |
| Nathan Mind Workers | 101 |
| Nathan Mind on-demand bots | 101 |
| Global imports | 15 |
| Tabor World release receipts | 7 |
| Total | 1,234 |

Each source catalog keeps its IDs and publication state. Entries describe the scope of the catalog. The callable directory specifies which operations this release exposes. The bundled payload consists of public catalog records. The named physical infrastructure targets remain separately provisioned.

## Live routes

| Route | Use |
| --- | --- |
| `/v1/fleet/receipts?start=1&limit=20` | Federation page of SQLite replica receipts |
| `/v1/nodes/node-001/fleet` | Node fleet home |
| `/v1/nodes/node-1000/fleet/receipt` | Verify the node's stored package |
| `/v1/nodes/node-001/fleet/catalog?collection=mind-bots` | Filter and page the catalog from node storage |
| `/v1/nodes/node-001/fleet/package.json` | Download the exact stored UTF-8 JSON |
| `/v1/nodes/node-001/fleet/capabilities` | Methods, input examples, and execution paths |
| `/v1/nodes/node-001/fleet/tools/425` | Run a fixed tool against the selected node's runtime |
| `/fleet/receipt` on ONE | Verify ONE's stored package |
| `/fleet/capabilities` on ONE | Run the same tool interface via the control plane |

There are ten newly callable Crown capabilities and an expanded Unicode edit script for tool 450. The prior 14 Crown routes, six Language Workers, and eight Imagination demos use explicit Cloudflare service bindings. The other cataloged capabilities retain their source project links and statuses. Tool execution is request-driven.

The native tool directory covers ledger balancing, state transition validation, time series audits, repeatable Bernoulli simulation, Boolean minimization, WAV synthesis, FFT, Morse timing, string and pipe resonance, color conversion, and a full bounded edit script. Payloads use JSON, except the WAV or SVG result of an audio or drawing tool.

## Integration and verification

Run the suite with Node 24.

```sh
node --test tabor-supercomputer-federation/fleet-release/release.test.mjs
```

`federation-entry.mjs` extends the existing Durable Object and calls the existing `nodeFetch` address selection. The production federation entry wraps the deployed catalog entry module so that its catalog and R2 binding stay available. The ONE adapter wraps ONE's production worker bundle and re-exports its Durable Object and workflow classes. Both adapters route only the documented fleet paths and delegate all other requests to the existing application.

Production releases use Cloudflare Worker versions with the existing bindings inherited and the three fleet service bindings added explicitly. Verify that the staged Durable Object namespace and other bindings match the previous deployment before promotion. Requests to the receipt page initialize the package once per node. Initialization is idempotent by release ID. Each receipt recomputes SHA-256 from the locally stored bytes.

For a future release, replace the generated catalog chunks, update the package digest in `bundle.mjs`, and assign a new release ID before uploading both Workers. Use each receipt page and the ONE receipt to compare storage mode, node identity, and digest. Verify the original federation task and ONE health routes after promotion.

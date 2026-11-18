# Nathan Tabor Sovereign Edge OS

[Live workbench](https://tabor-digital-edge-os.nathantaboract.workers.dev/) · [Syscall table](https://tabor-digital-edge-os.nathantaboract.workers.dev/registry/os-syscall-table.json) · [Background receipt](https://tabor-digital-edge-os.nathantaboract.workers.dev/api/batch-proof)

This Workspace publishes the 505-ID registry and a bounded, digital-only runtime. The separate pre-existing Worker at sovereign-edge-os.nathantaboract.workers.dev has its own deployment. This release uses tabor-digital-edge-os.

| Status | Meaning |
| --- | --- |
| Executable | Original 001–101 simulation described by the implementation field |
| Fixture | Runs the clearly named subset of a supplied OG milestone or utility |
| Specified | Source title is present and no handler is connected |
| Awaiting specification | The numeric ID and ring are reserved until the individual requirement has been supplied |

The shipped snapshot has 101 executable simulation handlers, 96 fixture handlers, 106 specified entries and 202 awaiting specifications in 102–202 and 304–404. Dates in the OG timeline come from the supplied historical outline. The brief did not specify a unique per-ID sequence for the first 101, so this workspace assigns specific kernels within the supplied seven ranges. Historical CPU, rotor, tape and game functions are small teaching fixtures.

## Layout

- **Ring 0** uses kernel/ and a dependency-free Rust/Wasm thermal cell in crates/thermal/.
- **Ring 1** uses fabric/, the Crypto & Logic modules, D1 graph fixtures, KV policy, R2 content-addressed receipts and a SQLite-backed Durable Object.
- **Ring 2** uses the messaging, signal, network and telemetry packages. Input is fixture data for operations described as live mail, browser, voice or network integrations.
- **Ring 3** uses agent-core/ for bounded DAG validation and output piping. The gateway provides JSON-RPC MCP tool listing and invocation for runnable read-only handlers.
- **Ring 4** uses shell/web-pwa/ and the device, media and browser utility packages. The shell and registry have offline caching. A desktop companion and device bridges remain integration work.

## Run and deploy

```sh
npm ci
rustup target add wasm32-unknown-unknown
npm run generate
npm run typecheck
npm test
npm run build
npx wrangler deploy
```

The production config binds the existing Cloudflare D1, KV, R2, Queue, Workflow and Durable Object. Seed D1 with fabric/schema.sql and set KV runtime-policy to read-only-syscalls-v1 when provisioning a separate account. Cloudflare Queue only accepts the fixed first-party acceptance-job ID through the consumer. Its Workflow runs fixtures, writes the verified result to private R2 under its SHA-256 and stores a receipt in the coordinator. The public API exposes that receipt. The Queue and Workflow are independent of browser requests.

### API

- GET /api/rings returns counts by ring.
- GET /api/modules/016/sample runs the checked FFT fixture. The registry lists the sample and actual implementation name for each runnable ID.
- POST /syscall accepts syscall_id and payload. A supplied trace ID is correlation data. Claimed tenant, role and approval fields confer zero privileges.
- POST /api/plan accepts up to 16 nodes. A node uses id, syscall, after and input. Supply from and into to map an explicit dependency’s output into a named input field.
- POST /mcp supports initialize, tools/list, tools/call and ping over JSON-RPC. The tool list is paginated. The listed operations are read-only.
- GET /api/act shows the 160 enriched ACT nodes, with the source collection kept in workers-platforms/act-seed.mjs. The whole-unit field is 8 bits and the composite seal is 16 bits. Seals label generation and anchor; SHA-256 is used separately for integrity receipts.

Mail sending, telephony, payments, live browsing, private user storage, privileged tools and desktop or mobile hardware interfaces require integrations and verified permissions before they can run.

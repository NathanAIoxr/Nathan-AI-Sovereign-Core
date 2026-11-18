# Sovereign Edge OS system specification

Build a serverless meta-OS on Cloudflare Workers. The repository registers OG-001–OG-101 and 001–404. Preserve their stable IDs. Keep the registry authoritative about whether an entry is executable, a bounded fixture, specified, or awaiting specification.

1. Use pure TypeScript or Rust WebAssembly for simulation and deterministic transforms. The common asynchronous handler accepts JSON or an ArrayBuffer and a binding environment. Persist relational and graph state in D1, blobs in R2, fixed policy data in KV, and strongly consistent coordination state in Durable Objects.
2. Treat request identity, privilege, and approval claims as untrusted. Public syscalls, MCP tools, and DAG steps are read-only. A future action that sends communications, moves money, performs external writes, or accesses private data must use trusted tenant authentication and action-specific approval verified independently of the request body. Do not execute arbitrary user scripts, connect to classified systems, or implement offensive actions.
3. Read registry/os-syscall-table.json before taking an ID. Keep 102–202 and 304–404 reserved until their individual specifications are supplied. OG timeline dates are submitted metadata. Keep historical fixtures independent of any network.
4. Implement a module in its package, regenerate its wrapper and registry with npm run generate, add a deterministic test, and run npm run typecheck, npm test and npm run build. Avoid Node APIs inside the Worker runtime. Build tooling may use Node.
5. Use typed data contracts to chain DAG outputs. Reject cycles and unknown dependencies before a step runs. Keep a Cloudflare foreground operation bounded and send longer first-party workloads through Queue and Workflow.

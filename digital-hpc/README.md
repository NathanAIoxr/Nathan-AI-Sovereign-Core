# Nathan Tabor Digital HPC

[Live workbench](https://tabor-digital-hpc.nathantaboract.workers.dev/) · [Federation entry](https://nathan-tabor-hyper-federation.nathantaboract.workers.dev/hpc)

Digital models convert the supplied HPC design into portable workloads with testable results. NASA’s public high-end computing reference identifies the roles of Aitken, Athena, Cabeus, Electra and Endeavour. The architecture endpoint maps those infrastructure ideas and your memory, interconnect and facility list to runnable, modeled or future digital components.

## Runtime

- A public coordinator invokes a private Cloudflare executor through a Service Binding. The baseline runs one FP64 shard. The expanded job runs ten shards and checks each result against an independent algebraic expression.
- The kernel processes 4,096 versus 40,960 dot-product terms and counts two algorithm operations per term. Host timing covers end-to-end shard coordination for each profile. The reported work factor measures verified terms per run and does not imply a throughput, latency or HPL improvement.
- R2 Standard holds the checkpoint JSON and R2 Infrequent Access holds an independently stored gzip copy. The default restore compares both copies against the canonical SHA-256. An alternate restore at /api/restore?storage=d1 uses two separate D1 databases. These online integrity exercises use a fixed fixture. Offline media, geographic isolation and production disaster recovery would require separate provisions.
- The fault endpoint injects one bit flip in one of three synthetic copies and recovers the original value by majority vote.
- The federation exposes HPC in Compute, Memory and Cloud and at /hpc. Its 1,000-slot namespace retains the same inventory. The workbench runs as standard Workers outside that namespace. It publishes ten attachment profiles for the identified Cloudflare supercomputer services. A profile selects the receipt label. All jobs currently execute on the shared private HPC executor.

## Reproduction

Run `node --test digital-hpc/worker.test.mjs`. Deploy `executor.mjs` and `model.mjs` as the ES modules for a private Worker. Deploy `worker.mjs` and `model.mjs` for the coordinator with `EXECUTOR` bound to the executor and `CHECKPOINTS` and `ARCHIVE` bound to distinct D1 databases initialized with `checkpoint.sql`. Insert the fixed `fixture` export at the key `fixtures/v1/checkpoint.json`, using codec `json` for the first copy and `gzip-base64` for the archive. Bind `WARM_OBJECTS` to the R2 Standard bucket and `COLD_OBJECTS` to the R2 Infrequent Access bucket. Write the JSON to `fixtures/v1/checkpoint.json` in Standard and its gzip bytes to `fixtures/v1/checkpoint.json.gz` in Infrequent Access. There is no public write route.

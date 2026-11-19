# Nathan Tabor database compute pools

The private control Worker routes a read-only database readiness check and an isolated FP64, memory, and scratch-disk smoke test. Each D1 database has two deterministic instance names per Container tier. The shared pool limit is 110 instances per tier for the verified inventory of 55 databases. Both pools start at zero and run a probe only when called by an authorized internal Worker through a service binding. The control Worker has neither a workers.dev route nor preview URLs.

| Pool | Instances per database | vCPU per instance | RAM per instance | Scratch disk per instance |
| --- | ---: | ---: | ---: | ---: |
| Compute (standard-2) | 2 | 1 | 6 GiB | 12 GB |
| Higher-capacity (standard-4) | 2 | 4 | 12 GiB | 20 GB |

At full concurrency, the target is 220 instances, 550 vCPUs, 1,980 GiB RAM and 3,520 GB of scratch disk. Existing D1 databases keep durable data. The probe only reads a constant and never sends database records to Containers. Durable workload output storage, failure-domain distribution, application bindings and production compute jobs require workload-specific configuration.

## Verify and generate deployment inputs

```sh
node --test deployment.test.mjs
node deployment.mjs /path/to/private-d1-inventory.json > /path/to/private-deployment.json
```

Generate the inputs using an authenticated D1 inventory with names and UUIDs. Upload `worker.mjs` using the generated Worker metadata, and include `initialMigration` as `migrations` only when creating the two classes. Keep the workers.dev and preview routes disabled. Create both Container applications with their matching class using the generated stanzas. An internal binding can call `GET /healthz` or `POST /probe?db=NAME&slot=compute-1`. Other slots are `compute-2`, `higher-1`, and `higher-2`.

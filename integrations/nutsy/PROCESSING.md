# NUTSY processing baseline

Use the existing Sovereign Supercomputer reference implementation from this checkout. From the repository root on `nathan-1`:

```sh
python3 integrations/nutsy/processing.py --expect-host nathan-1 \
  --output ~/.local/state/nutsy/processing.json
```

The benchmark runs the same deterministic integer replay used to verify the Cloudflare FP64 result. It checks every local result against the existing verifier, measures serial and bounded parallel batches, and reports the fastest repeatable setting. When two settings run within 5%, it selects the lower process count. The process ceiling honors visible cgroup v2 quotas and CPU affinity and leaves one permitted CPU for the Conductor when capacity allows. The process count applies only to the profiling run.

The default seed and term count reproduce the existing source checksum `8600491170`. The numbers measured here are local reference terms per second. Keep them distinct from FP64 executor timings, sustained HPL throughput, device capacity, and cloud reservation counts.

Pair this result with the [federation receipt](FEDERATION.md), [queue reconciliation](JOB-RECOVERY.md), and the live Conductor's health. Before applying a worker configuration change, compare backlog age, processing time, CPU saturation, memory pressure, disk latency and failed tasks before and after the change. The profiler only measures a candidate setting. The existing Conductor service needs a verified configuration or worker integration to apply that setting to its dispatch queue.

Use the hostname check for any production run. Record the checkout commit, time and workload sizes alongside the profile. No credentials or user records are required by the profiler.

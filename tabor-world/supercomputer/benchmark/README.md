# NATHAN TABOR 2X+ — Exascale benchmark engineering

The user's earlier reference value is 2.198 exaflops. Twice that numerical value is **4.396 exaflops**. The reference computer and whether the value represents HPL FP64 Rmax, theoretical peak, or another measure have not been verified. No existing Cloudflare Worker or conventional cloud VM can be described as delivering this performance without measured evidence.

Run `python estimate.py --node-fp64-tflops 1000 --efficiency 0.7` to estimate an illustrative node count. The assumptions are user-supplied, not hardware claims. Use a verified HPL result and power/cost records for acceptance.

Cloudflare Workers/D1/R2 coordinate the control plane; the HPC data plane requires authorized CPU/GPU accelerators, high-bandwidth interconnect, storage, power, cooling, monitoring, and actual procurement or rentals. The existing 64-agent registry is a task inventory, not an exascale cluster.

## Acceptance gates
1. Identify reference machine and metric.
2. Obtain approved hardware/provider, budget and network topology.
3. Deploy real nodes and secure bootstrap.
4. Install HPC runtime and distributed HPL benchmark.
5. Collect verified HPL Rmax, power, latency, cost and reproducibility receipts.
6. Claim 2x only if measured Rmax >= 2 x verified reference Rmax.

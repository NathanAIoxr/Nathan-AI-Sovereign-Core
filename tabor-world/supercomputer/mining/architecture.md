# NATHAN TABOR — SOVEREIGN COMPUTE + BITCOIN MINING SERVER FARM

## Two distinct physical systems
**HPC supercomputer:** CPU/GPU accelerator nodes, low-latency high-bandwidth fabric, parallel filesystem, MPI/Slurm, reproducible HPL FP64 benchmarks. Target 4.396 exaflops is unverified and is not a mining hash rate.

**Bitcoin mining farm:** SHA-256 ASIC machines, power distribution, electrical protection, network switching, cooling, mining pool/solo node connectivity, wallet-controlled payout addresses, and independent hashrate monitoring. ASIC mining hashrate in TH/s or EH/s is NOT FLOPS. Cloudflare Workers or Containers are management/control services, not substitutes for ASIC hardware.

## Modular rack layout
- Rack: unique rack ID, circuit IDs, metered PDU, rated power, ventilation/airflow, temperature and humidity sensors.
- Miner: unique miner ID, manufacturer/model, nameplate watts, expected TH/s, MAC/IP, firmware, pool endpoint, owner-controlled payout reference (never wallet seed), maintenance status.
- Site: breaker/panel capacity, usable power budget after safety margins, cooling/heat-rejection plan, network segmentation, emergency shutoff, fire protection.
- Server: Cloudflare API + D1 registry, immutable observations, alerting, operator approval for changes. No unrestricted remote commands.
- HPC: separate rack/fabric/power plan, do not commingle mining ASIC capacity with FP64 compute.

## Deployment stages
1. Recover original user schematics and part numbers, preserving revisions and provenance.
2. Electrical engineer validates site capacity, power/cooling, fire and local compliance.
3. Obtain operator approval for hardware purchases and ongoing energy costs.
4. Install and secure actual ASICs and compute nodes.
5. Integrate telemetry and register measured hashrate, power and temperatures.
6. Verify receipts and reproducible performance. Never imply hardware exists from software records.

This document is a reference engineering architecture, not a claim that equipment has been purchased or installed.

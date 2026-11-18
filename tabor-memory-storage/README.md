# RAM and Hard Drives — The Nathan Tabor Way

The target is **85% direct hot-path budget and 15% or more outside it**. This is a sizing target. Benchmark your own workload before reserving actual huge pages or making scheduler changes.

| Step | Implemented |
|---|---|
| 1+1=2 Build | Inventory RAM, NUMA, huge-page pools and devices. Size memory and drives. |
| 1−1=0 Clear | Compare buffered and direct I/O on the same test filesystem. Use direct I/O where the measured workload benefits. |
| 1×1=1 Integrate | Link the memory and storage Worker to the Sovereign Digital Stack, using a service binding. |
| 1÷1=1 Verify | Verify every test block and check archive restores against a separately retained SHA-256 manifest. |

## Run on Linux

Build with GCC and run without root. Pick a test directory on the filesystem to measure.

```sh
gcc -std=gnu17 -O2 -Wall -Wextra -Werror bench.c -o /tmp/tabor-mem-bench
python3 inventory.py
/tmp/tabor-mem-bench ram 128
/tmp/tabor-mem-bench buffered /path/to/test-directory 256
/tmp/tabor-mem-bench direct /path/to/test-directory 256
```

RAM size is per buffer, so a 128 MiB copy uses two 128 MiB buffers. Larger data sets may help distinguish DRAM from cache. This is a single-threaded copy measurement. Divide copied bytes by elapsed seconds to get useful copy bandwidth. Chip-vendor bandwidth and cache or DRAM traffic measure different things.

The drive benchmark creates a unique temporary regular file and unlinks its directory entry on opening. It reports sequential 1 MiB requests at queue depth one, read and write p99, and the time spent in the final `fdatasync`. Buffered readback may hit the page cache. Direct mode requests `O_DIRECT`, uses file alignment information when the kernel exposes it, and fails visibly on unsupported operations. Filesystem and device behavior still apply. Results from this test do not measure random workloads, multi-queue saturation, power-loss recovery, ZNS zone append/reset, or drive endurance. Use a dedicated test volume and workload-specific tests to qualify those properties.

```sh
python3 archive.py create /path/to/archive /path/to/new-manifest.json snapshot.tar
python3 archive.py verify /path/to/restored-archive /path/to/new-manifest.json
```

Keep the trusted manifest independently from the data. The verifier detects mismatches against that manifest. Offline copies, retention rules and replication supply the recovery policy.

## Edge

- `GET /v1/tiers` returns the nine tiers and the hardware-to-cloud analogies.
- `GET /v1/plan` accepts `ram_gib`, `reserve_gib`, `page_mib` (2 or 1024), `drives`, `drive_tb`, `parity`, and `spares`. The default model describes 256 GiB RAM and eight 30 TB drives. Parity is expressed as an equivalent number of drives in one pool. Capacity excludes filesystem, metadata, rebuild headroom and replication overhead. It does not certify failure tolerance.
- `GET /v1/stack` reads the Sovereign Digital Stack health through the Cloudflare service binding.
- `GET /health` reports the published tier count and binding presence.

Edge tier descriptions are design analogies. The Worker serves the catalog, calculates plans and checks the upstream service. Durable Objects, KV, D1 and R2 are listed for their future application roles. The Worker never imports Linux inventory or archive contents.

## Hardware qualification

Match HBM to the accelerator package. Match ECC DDR5 and SOCAMM2 to the host platform. Qualify CPU-to-CXL latency and firmware support before placing hot data on expanders. Compare TLC endurance and steady-state latency separately from QLC capacity, and qualify actual zoned namespace features before configuring zone-aware applications. Compare HDD arrays on rebuild time, failure domains, restore throughput and usable capacity. Keep device caches, ECC, thermal protections and recovery settings in the comparison.

Source references include [Micron HBM4](https://www.micron.com/products/memory/hbm/hbm4), [Micron SOCAMM2](https://www.micron.com/products/memory/lpddr-modules/socamm), [CXL 3.1](https://computeexpresslink.org/wp-content/uploads/2024/03/CXL_3.1-Webinar-Presentation_Feb_2024.pdf), [Micron 9650](https://www.micron.com/content/dam/micron/global/public/products/storage/ssds/data-center/9650/9650-nvme-ssd-product-brief.pdf), [Seagate Exos M](https://www.seagate.com/support/internal-hard-drives/enterprise-hard-drives/exos-m/), and [Linux direct-I/O alignment](https://man7.org/linux/man-pages/man2/statx.2.html).

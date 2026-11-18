"""Read Linux storage, memory and huge-page inventory without changing host settings."""
import json
from pathlib import Path


def read(path):
    try:
        return path.read_text().strip()
    except OSError:
        return None


def main():
    devices = []
    for drive in sorted(Path("/sys/block").glob("*")):
        if drive.name.startswith(("loop", "ram")):
            continue
        devices.append({
            "device": drive.name,
            "model": read(drive / "device/model"),
            "rotational": read(drive / "queue/rotational"),
            "zoned_model": read(drive / "queue/zoned"),
            "logical_block_bytes": read(drive / "queue/logical_block_size"),
            "physical_block_bytes": read(drive / "queue/physical_block_size"),
            "scheduler": read(drive / "queue/scheduler"),
        })
    hugepages = {
        pool.name: {key: read(pool / key) for key in ("nr_hugepages", "free_hugepages")}
        for pool in sorted(Path("/sys/kernel/mm/hugepages").glob("hugepages-*"))
    }
    meminfo = read(Path("/proc/meminfo")) or ""
    keys = {"MemTotal", "MemAvailable", "SwapTotal", "Hugepagesize"}
    memory = dict(line.split(":", 1) for line in meminfo.splitlines()
                  if line.split(":", 1)[0] in keys)
    numa_nodes = [path.name for path in sorted(Path("/sys/devices/system/node").glob("node[0-9]*"))]
    print(json.dumps({"devices": devices, "memory": memory, "hugepage_pools": hugepages,
                      "numa_nodes": numa_nodes}, indent=2))


if __name__ == "__main__":
    main()

"""Measure safe local process concurrency with the existing Sovereign compute replay."""

import argparse
from concurrent.futures import ProcessPoolExecutor
from fractions import Fraction
import hashlib
import json
import os
from pathlib import Path
import platform
from statistics import median
import sys
from time import perf_counter_ns

from federation import write_receipt

SOVEREIGN = Path(__file__).resolve().parents[2] / "app-factory/nathan-ai/sovereign-supercomputer"
sys.path.insert(0, str(SOVEREIGN))
from nathan_ai_supercomputer import KERNEL, MASK, replay


def cpu_quota(root=Path("/sys/fs/cgroup"), proc=Path("/proc/self/cgroup")):
    """Find the tightest visible cgroup v2 limit, including parent cgroups."""
    try:
        branch = next(line[3:] for line in proc.read_text().splitlines() if line.startswith("0::"))
    except (OSError, StopIteration):
        return None
    leaf = (root / branch.lstrip("/")).resolve()
    root = root.resolve()
    if not leaf.is_relative_to(root):
        return None
    quotas = []
    for group in (leaf, *leaf.parents):
        try:
            limit, period = (group / "cpu.max").read_text().split()
            if limit != "max":
                quotas.append(Fraction(int(limit), int(period)))
        except (OSError, ValueError, ZeroDivisionError):
            pass
        if group == root:
            break
    return min(quotas, default=None)


def worker_budget(affinity, quota):
    effective = min(affinity, int(quota)) if quota is not None else affinity
    # Preserve one full allowed CPU for the Conductor when capacity permits.
    return max(1, min(8, effective - 1))


def replay_batch(batch):
    return [replay(seed, terms)[0] for seed, terms in batch]


def measure(batches, workers, expected):
    samples = []
    if workers == 1:
        for _ in range(3):
            start = perf_counter_ns()
            actual = [value for batch in batches for value in replay_batch(batch)]
            samples.append(perf_counter_ns() - start)
            if actual != expected:
                raise ValueError("Serial checksum mismatch")
    else:
        with ProcessPoolExecutor(max_workers=workers) as executor:
            for _ in range(3):
                start = perf_counter_ns()
                actual = [value for result in executor.map(replay_batch, batches) for value in result]
                samples.append(perf_counter_ns() - start)
                if actual != expected:
                    raise ValueError(f"Parallel checksum mismatch for {workers} workers")
    return {"workers": workers, "elapsed_ns": samples, "median_ns": median(samples)}


def profile(seed, terms, jobs):
    affinity = len(os.sched_getaffinity(0))
    quota = cpu_quota()
    budget = worker_budget(affinity, quota)
    work = [((seed + offset) & MASK, terms) for offset in range(jobs)]
    expected = replay_batch(work)
    candidates = sorted({1, budget, *(size for size in (2, 4) if size <= budget)})
    results = []
    for workers in candidates:
        width = (jobs + workers - 1) // workers
        batches = [work[offset:offset + width] for offset in range(0, jobs, width)]
        results.append(measure(batches, workers, expected))
    fastest = min(results, key=lambda row: row["median_ns"])
    # Prefer lower concurrency when timings are within 5 percent.
    selected = next(row for row in results if row["median_ns"] <= fastest["median_ns"] * 1.05)
    digest = hashlib.sha256(json.dumps(expected, separators=(",", ":")).encode()).hexdigest()
    return {
        "schema": "nutsy.processing-profile.v1", "host": platform.node(), "kernel": KERNEL,
        "measurement": "local integer reference replay", "comparable_hpl": False,
        "cpu_affinity_count": affinity, "cgroup_cpu_quota": str(quota) if quota is not None else None,
        "worker_ceiling": budget, "first_seed": seed, "terms_per_job": terms, "jobs_per_sample": jobs,
        "selected_workers": selected["workers"],
        "measured_terms_per_second": round(jobs * terms * 1e9 / selected["median_ns"]),
        "source_compatible_checksum": expected[0], "checksums_sha256": digest,
        "samples": results,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seed", type=int, default=73)
    parser.add_argument("--terms", type=int, default=32768)
    parser.add_argument("--jobs", type=int, default=48)
    parser.add_argument("--expect-host")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.expect_host and platform.node() != args.expect_host:
        parser.error(f"Expected {args.expect_host}, running on {platform.node()}")
    if not 0 <= args.seed <= MASK or not 64 <= args.terms <= 32768 or not 8 <= args.jobs <= 128:
        parser.error("Use a 32-bit unsigned seed, 64–32768 terms and 8–128 jobs")
    try:
        result = json.dumps(profile(args.seed, args.terms, args.jobs), indent=2) + "\n"
        if args.output:
            write_receipt(args.output, result)
        else:
            print(result, end="")
    except (OSError, ValueError) as err:
        parser.exit(1, f"{err}\n")


if __name__ == "__main__":
    main()

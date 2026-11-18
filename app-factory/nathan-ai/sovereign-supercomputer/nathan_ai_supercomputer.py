"""Run and verify Nathan AI FP64 receipts locally, or record a supplied HPL result."""
import argparse
import hashlib
import json
import re
import time
from pathlib import Path

MASK = (1 << 32) - 1
SCALE = 1 << 20
KERNEL = "fp64-dot-lcg32-v1"


def replay(seed, terms):
    state = seed
    checksum = 0
    for _ in range(terms):
        state = (1664525 * state + 1013904223) & MASK
        left = state >> 22
        state = (1664525 * state + 1013904223) & MASK
        checksum += left * (state >> 22)
    return checksum, state


def verify(path):
    envelope = json.loads(path.read_text())
    receipt = envelope["receipt"]
    canonical = json.dumps(receipt, ensure_ascii=False, separators=(",", ":"))
    if hashlib.sha256(canonical.encode()).hexdigest() != envelope["sha256"]:
        raise ValueError("Receipt digest mismatch.")
    seed, terms = receipt["seed"], receipt["terms"]
    shards = receipt["shards"]
    if (receipt["kernel"] != KERNEL or not 0 <= seed <= MASK or not 64 <= terms <= 32768
            or not 1 <= len(shards) <= 8 or receipt["shard_count"] != len(shards)
            or receipt["checksum_scale"] != SCALE):
        raise ValueError("Receipt contract mismatch.")
    state = seed
    offset = total = 0
    invocations = set()
    for shard in shards:
        count = shard["count"]
        if (shard["global_offset"] != offset or shard["start"] != state
                or not 1 <= count <= terms - offset or shard["operations"] != count * 2
                or not shard["invocation"] or shard["invocation"] in invocations):
            raise ValueError("Shard contract mismatch.")
        checksum, state = replay(state, count)
        if checksum != shard["checksum"]:
            raise ValueError("Shard replay mismatch.")
        invocations.add(shard["invocation"])
        total += checksum
        offset += count
    if offset != terms or total != receipt["checksum"] or receipt["operations"] != terms * 2:
        raise ValueError("Combined replay mismatch.")
    return {"verified": True, "terms": terms, "operations": terms * 2, "checksum": total,
            "shards": len(shards), "sha256": envelope["sha256"], "comparable_hpl": False}


def hpl_receipt(path):
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    row = re.compile(r"^\s*(W[RC]\w+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s*$", re.M)
    results = []
    for section in re.split(r"(?m)^\s*T/V\s+N\s+NB\s+P\s+Q\s+Time\s+Gflops\s*$", text)[1:]:
        match = row.search(section)
        if not match:
            continue
        verdict = re.search(r"(?m)^.*normalized residual.*?\b(PASSED|FAILED)\b", section[match.end():])
        if not verdict or verdict[1] != "PASSED":
            continue
        variant, size, block, processes_p, processes_q, seconds, gflops = match.groups()
        results.append({"variant": variant, "size": int(size), "block": int(block),
                        "process_grid": [int(processes_p), int(processes_q)],
                        "seconds": float(seconds), "gflops": float(gflops)})
    if not results:
        raise ValueError("No HPL result row with a passing normalized residual was found.")
    best = max(results, key=lambda result: result["gflops"])
    achieved = best["gflops"] / 1_000_000_000
    return {"source": path.name, "sha256": hashlib.sha256(raw).hexdigest(), "best": best,
            "reported_eflop_s": achieved, "lineshine_target_eflop_s": 4.3968,
            "reported_result_meets_target": achieved >= 4.3968, "provenance": "user-supplied HPL output"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_subparsers(dest="mode", required=True)
    run = modes.add_parser("run")
    run.add_argument("--seed", type=int, default=73)
    run.add_argument("--terms", type=int, default=32768)
    modes.add_parser("verify").add_argument("receipt", type=Path)
    modes.add_parser("hpl").add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        if args.mode == "verify":
            result = verify(args.receipt)
        elif args.mode == "hpl":
            result = hpl_receipt(args.output)
        else:
            if not 0 <= args.seed <= MASK or not 64 <= args.terms <= 32768:
                raise ValueError("Use a 32-bit unsigned seed and 64–32768 terms.")
            start = time.perf_counter_ns()
            checksum, _ = replay(args.seed, args.terms)
            result = {"mode": "local integer replay", "kernel": KERNEL, "seed": args.seed,
                      "terms": args.terms, "checksum": checksum, "elapsed_ns": time.perf_counter_ns() - start,
                      "comparable_hpl": False}
    except (OSError, KeyError, TypeError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()

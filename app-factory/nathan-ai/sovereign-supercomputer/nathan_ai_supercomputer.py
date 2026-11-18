"""Run and verify Nathan AI FP64 receipts locally, or record a supplied HPL result."""
import argparse
import hashlib
import json
import math
import re
import time
from pathlib import Path

MASK = (1 << 32) - 1
SCALE = 1 << 20
KERNEL = "fp64-dot-lcg32-v1"
FABRIC_SHARD_TERMS = 131072
FABRIC_MAX_TERMS = FABRIC_SHARD_TERMS * 16
TOP500_AGGREGATE_EFLOP_S = 19.71
HPL_MAX_LINE_BYTES = 64 * 1024
HPL_NUMBER = r"[+-]?(?:[0-9]{1,32}(?:\.[0-9]{0,32})?|\.[0-9]{1,32})(?:[eE][+-]?[0-9]{1,4})?"
HPL_HEADING = re.compile(r"T/V\s+N\s+NB\s+P\s+Q\s+Time\s+Gflops")
HPL_VARIANT = r"W[RC][A-Za-z0-9]{1,24}"
HPL_ROW_START = re.compile(rf"{HPL_VARIANT}(?:\s|$)")
HPL_ROW = re.compile(rf"({HPL_VARIANT})\s+([0-9]{{1,10}})\s+([0-9]{{1,10}})"
                     rf"\s+([0-9]{{1,10}})\s+([0-9]{{1,10}})\s+({HPL_NUMBER})\s+({HPL_NUMBER})")
HPL_RESIDUAL = re.compile(
    r"(?:\|\|Ax-b\|\|_oo\s*/\s*\(eps\s*\*\s*\(\|\|A\|\|_oo\s*\*\s*\|\|x\|\|_oo"
    r"\s*\+\s*\|\|b\|\|_oo\)\s*\*\s*N\)\s*=|(?:HPL\s+)?normalized\s+residual\s*[:=]?)"
    rf"\s*({HPL_NUMBER})\s*(?:\.{{2,32}}|:)?", re.I,
)


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
    profile = receipt.get("profile", "classic")
    if profile not in {"classic", "fabric"}:
        raise ValueError("Unsupported receipt profile.")
    wide = profile == "fabric"
    max_terms, max_shards = (FABRIC_MAX_TERMS, 16) if wide else (32768, 8)
    if (receipt["kernel"] != KERNEL or not 0 <= seed <= MASK or not 64 <= terms <= max_terms
            or not 1 <= len(shards) <= max_shards or receipt["shard_count"] != len(shards)
            or receipt["checksum_scale"] != SCALE):
        raise ValueError("Receipt contract mismatch.")
    state = seed
    offset = total = 0
    invocations = set()
    for index, shard in enumerate(shards):
        count = shard["count"]
        if (shard["global_offset"] != offset or shard["start"] != state
                or not 1 <= count <= terms - offset or shard["operations"] != count * 2
                or not shard["invocation"] or shard["invocation"] in invocations):
            raise ValueError("Shard contract mismatch.")
        checksum, state = replay(state, count)
        if checksum != shard["checksum"]:
            raise ValueError("Shard replay mismatch.")
        if wide and (shard["index"] != index or count > FABRIC_SHARD_TERMS or shard["next_state"] != state):
            raise ValueError("Fabric shard boundary mismatch.")
        invocations.add(shard["invocation"])
        total += checksum
        offset += count
    if offset != terms or total != receipt["checksum"] or receipt["operations"] != terms * 2:
        raise ValueError("Combined replay mismatch.")
    return {"verified": True, "profile": profile, "terms": terms, "operations": terms * 2, "checksum": total,
            "shards": len(shards), "sha256": envelope["sha256"], "comparable_hpl": False}


def hpl_receipt(path):
    digest = hashlib.sha256()
    active_table = False
    pending = best = None
    with path.open("rb") as stream:
        for raw in iter(lambda: stream.readline(HPL_MAX_LINE_BYTES + 1), b""):
            if len(raw) > HPL_MAX_LINE_BYTES:
                raise ValueError("HPL output contains a line longer than 64 KiB.")
            digest.update(raw)
            line = raw.decode("utf-8").strip()
            if HPL_HEADING.fullmatch(line):
                active_table, pending = True, None
            elif line.startswith("End of Tests"):
                active_table, pending = False, None
            elif active_table and HPL_ROW_START.match(line):
                pending = hpl_row(line)
            elif pending is not None:
                result = line.rsplit(maxsplit=1)
                if len(result) != 2 or result[1].upper() not in {"PASSED", "FAILED"}:
                    continue
                residual_match = HPL_RESIDUAL.fullmatch(result[0])
                if residual_match is None:
                    continue
                residual = float(residual_match[1])
                if result[1].upper() == "PASSED" and math.isfinite(residual) and residual >= 0:
                    if best is None or pending["gflops"] > best["gflops"]:
                        best = {**pending, "normalized_residual": residual}
                pending = None
    if best is None:
        raise ValueError("No HPL result row with a passing normalized residual was found.")
    achieved = best["gflops"] / 1_000_000_000
    return {"source": path.name, "sha256": digest.hexdigest(), "best": best,
            "reported_eflop_s": achieved, "lineshine_target_eflop_s": 4.3968,
            "reported_result_meets_target": achieved >= 4.3968,
            "top500_aggregate_edition": "November 2026", "top500_aggregate_eflop_s": TOP500_AGGREGATE_EFLOP_S,
            "reported_result_exceeds_top500_aggregate": achieved > TOP500_AGGREGATE_EFLOP_S,
            "provenance": "user-supplied HPL output"}


def hpl_row(line):
    match = HPL_ROW.fullmatch(line)
    if match is None:
        return None
    variant, size, block, processes_p, processes_q, seconds, gflops = match.groups()
    size, block, processes_p, processes_q = map(int, (size, block, processes_p, processes_q))
    duration, speed = float(seconds), float(gflops)
    if min(size, block, processes_p, processes_q) <= 0:
        return None
    if not all(math.isfinite(value) and value > 0 for value in (duration, speed)):
        return None
    return {"variant": variant, "size": size, "block": block, "process_grid": [processes_p, processes_q],
            "seconds": duration, "gflops": speed}


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
            if not 0 <= args.seed <= MASK or not 64 <= args.terms <= FABRIC_MAX_TERMS:
                raise ValueError(f"Use a 32-bit unsigned seed and 64–{FABRIC_MAX_TERMS} terms.")
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

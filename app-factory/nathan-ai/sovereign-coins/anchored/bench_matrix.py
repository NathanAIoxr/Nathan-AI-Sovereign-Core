#!/usr/bin/env python3
"""Nathan AI — bounded, offline Alpha/Beta SHA-256 CPU benchmark.

Measures local algorithm steps. Does not mine tokens, bypass network difficulty,
access CPU C-state/MSR registers, run proxies or infer energy cost/earnings.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import time
from pathlib import Path

MAX_SAMPLES = 250_000


def canonical_packet(nonce: int) -> bytes:
    """Same fixed key order as the browser AnchoredSovereignMatrix."""
    obj = [
        ["schema", "nathan-ai.anchored-packet.v1"],
        ["ticker", "SIN"],
        ["nonce", nonce],
        ["units", 1],
        ["payload", "Local benchmark only"],
        ["consent", True],
    ]
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def run_benchmark(samples: int = 5_000) -> dict:
    if type(samples) is not int or not 1 <= samples <= MAX_SAMPLES:
        raise ValueError(f"Choose a whole sample count from 1 to {MAX_SAMPLES:,}")
    if not (1 + 1 == 2 and format(2, "b") == "10" and 1 - 1 == 0):
        raise RuntimeError("BUILD/CLEAR arithmetic invariant failed")

    start_wall = time.perf_counter()
    start_cpu = time.process_time()
    mismatches = 0
    for nonce in range(samples):
        # Axis Alpha: assemble candidate + digest in forward schema order.
        packet = canonical_packet(nonce)
        alpha_digest = hashlib.sha256(packet).digest()

        # Axis Beta: check field order in reverse, rehash the SAME input forward.
        fields = json.loads(packet)
        inspected_reverse = list(reversed(fields))
        if inspected_reverse[0][0] != "consent" or inspected_reverse[-1][0] != "schema":
            mismatches += 1
        beta_digest = hashlib.sha256(packet).digest()
        if beta_digest != alpha_digest:
            mismatches += 1

    wall = time.perf_counter() - start_wall
    cpu = time.process_time() - start_cpu
    return {
        "schema": "nathan-ai.anchored.benchmark.v1",
        "mode": "local_synthetic_test_only",
        "axis_alpha": "forward packet and SHA-256",
        "axis_beta": "reverse-order field review and independent forward SHA-256",
        "samples": samples,
        "sha256_operations": 2 * samples,
        "integrity_mismatches": mismatches,
        "wall_seconds": round(wall, 8),
        "cpu_seconds": round(cpu, 8),
        "samples_per_second": round(samples / wall, 2) if wall > 0 else None,
        "watts_measured": None,
        "energy_kwh_measured": None,
        "actual_mined_tokens": None,
        "realized_output_usd": None,
        "16_to_1_cost_efficiency_verified": False,
        "cpu_registers_changed": False,
        "proxy_connections_created": 0,
        "note": "Not comparable to a cryptocurrency network hashrate; hashing and canonicalization done for this reference packet format.",
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--samples", type=int, default=5_000)
    p.add_argument("--out", type=Path, help="Write results to JSON, optional")
    a = p.parse_args()
    output = json.dumps(run_benchmark(a.samples), indent=2) + "\n"
    if a.out:
        a.out.write_text(output, encoding="utf-8")
        print(f"Benchmark report written to {a.out}")
    else:
        print(output, end="")


if __name__ == "__main__":
    main()

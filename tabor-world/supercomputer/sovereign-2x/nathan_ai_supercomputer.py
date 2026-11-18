#!/usr/bin/env python3
"""Nathan Tabor's reproducible binary64 workload and SQLite receipt journal."""

import argparse
import hashlib
import json
import sqlite3
from pathlib import Path
from time import perf_counter_ns, time_ns
from uuid import UUID, uuid4

KERNEL = "fp64-dot-lcg32-v1"
ROOT = Path(__file__).resolve().parent


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def validate_inputs(seed, terms):
    if type(seed) is not int or not 0 <= seed <= 0xFFFFFFFF or type(terms) is not int or not 64 <= terms <= 32_768:
        raise ValueError("Use a 32-bit unsigned seed and 64–32768 terms.")


def dot(seed, terms):
    state, value = seed, 0.0
    for _ in range(terms):
        state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
        left = (state >> 22) / 1024
        state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
        right = (state >> 22) / 1024
        value += left * right
    return int(value * 1048576)


def verify_cluster(document):
    receipt = document["receipt"]
    seed, terms, count = (receipt[key] for key in ("seed", "terms", "shard_count"))
    validate_inputs(seed, terms)
    if terms > 16_384 or type(count) is not int or not 1 <= count <= 4:
        raise ValueError("Invalid cluster dimensions.")
    shards = receipt["shards"]
    checks = {
        "receipt_digest": digest(receipt) == document["sha256"],
        "shards": receipt["schema"] == "nathan-fp64-mesh-v1" and receipt["kernel"] == KERNEL
        and str(UUID(receipt["run_id"])) == receipt["run_id"] and len(shards) == count,
        "combined": False,
    }
    invocation_ids = set()
    for index, shard in enumerate(shards):
        offset = index * terms // count
        length = (index + 1) * terms // count - offset
        start = seed
        for _ in range(2 * offset):
            start = (start * 1664525 + 1013904223) & 0xFFFFFFFF
        invocation = shard["invocation"]
        matches = (
            str(UUID(invocation)) == invocation and invocation not in invocation_ids
            and shard["executor"] == "nathan-sovereign-fp64-executor"
            and shard["run_id"] == receipt["run_id"] and shard["kernel"] == KERNEL
            and shard["index"] == index and shard["slot"] == (seed + index) % 320
            and shard["offset"] == offset and shard["count"] == length
            and shard["operations"] == 2 * length
            and shard["start"] == start and shard["checksum"] == dot(start, length)
        )
        invocation_ids.add(invocation)
        checks["shards"] = checks["shards"] and matches
    checks["combined"] = (
        checks["shards"] and receipt["operations"] == terms * 2 and receipt["checksum_scale"] == 1048576
        and sum(shard["checksum"] for shard in shards) == receipt["checksum"] == dot(seed, terms)
    )
    return {"verified": all(checks.values()), "checks": checks}


class NathanTaborSupercomputer:
    def __init__(self, db_path=":memory:"):
        self.connection = sqlite3.connect(db_path)
        self.connection.executescript((ROOT / "compute.sql").read_text())
        self.blueprint = json.loads((ROOT / "blueprint.json").read_text())

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.connection.close()

    def run(self, seed=73, terms=2048):
        validate_inputs(seed, terms)
        start = perf_counter_ns()
        checksum = dot(seed, terms)
        elapsed = perf_counter_ns() - start
        result = {"kernel": KERNEL, "seed": seed, "terms": terms, "checksum": checksum}
        receipt = {"run_id": str(uuid4()), "created_ms": time_ns() // 1_000_000, "source": "python-local",
                   **result, "result_hash": digest(result), "elapsed_ns": elapsed, "operations": 2 * terms,
                   "timer": "perf_counter_ns", "precision": "binary64", "comparable_hpl": False,
                   "verified": dot(seed, terms) == checksum}
        proof = digest(receipt)
        with self.connection:
            self.connection.execute(
                "INSERT INTO sovereign_compute_runs VALUES(?,?,?,?,?)",
                (receipt["run_id"], receipt["created_ms"], receipt["source"], canonical(receipt), proof),
            )
        return {**receipt, "digest": proof, "measured_flop_s": receipt["operations"] * 1e9 / elapsed if elapsed > 0 else None}

    def audit(self, run_id):
        row = self.connection.execute(
            "SELECT receipt,digest FROM sovereign_compute_runs WHERE run_id=?", (run_id,),
        ).fetchone()
        if row is None:
            raise ValueError("Local run ID not found.")
        receipt = json.loads(row[0])
        return digest(receipt) == row[1] and self.verify_result(receipt)

    @staticmethod
    def verify_result(receipt):
        data = {key: receipt[key] for key in ("seed", "terms", "checksum")}
        validate_inputs(data["seed"], data["terms"])
        expected = {"kernel": KERNEL, **data}
        return receipt["kernel"] == KERNEL and dot(data["seed"], data["terms"]) == data["checksum"] and digest(expected) == receipt["result_hash"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=":memory:")
    sub = parser.add_subparsers(dest="command", required=True)
    benchmark = sub.add_parser("run")
    benchmark.add_argument("--seed", type=int, default=73)
    benchmark.add_argument("--terms", type=int, default=2048)
    audit = sub.add_parser("audit")
    audit.add_argument("run_id")
    verify = sub.add_parser("verify-edge")
    verify.add_argument("receipt", type=Path)
    verify_mesh = sub.add_parser("verify-cluster")
    verify_mesh.add_argument("receipt", type=Path)
    sub.add_parser("targets")
    args = parser.parse_args()
    try:
        with NathanTaborSupercomputer(args.db) as engine:
            if args.command == "run":
                result = engine.run(args.seed, args.terms)
            elif args.command == "targets":
                result = engine.blueprint
            elif args.command == "audit":
                result = {"verified": engine.audit(args.run_id)}
            elif args.command == "verify-cluster":
                result = verify_cluster(json.loads(args.receipt.read_text()))
            else:
                document = json.loads(args.receipt.read_text())
                frame = document["frame"]
                e = frame["Execution"]
                checks = {
                    "frame_digest": digest(frame) == document["digest"],
                    "kernel_executed": e["operations"] == 2 * e["terms"],
                    "kernel_replay": engine.verify_result({
                        **e, "kernel": frame["Identity"]["kernel"], "result_hash": frame["Mirror"]["resultHash"],
                    }),
                }
                result = {"verified": all(checks.values()), "checks": checks}
    except (ValueError, KeyError, OSError, TypeError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, indent=2))
    return 1 if result.get("verified") is False else 0


if __name__ == "__main__":
    raise SystemExit(main())

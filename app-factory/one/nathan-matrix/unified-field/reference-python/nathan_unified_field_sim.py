#!/usr/bin/env python3
"""NATHAN AI / Unified 0-9 field: conceptual 4x6 binary simulation.

This is an interpretive model, NOT evidence that a hidden papal hierarchy
exists or that ancient texts encode a literal external control mechanism.

Definition: M[i,j] = phi_j(T_i(x)), where phi_j selects feature j.
0 = source/boundary; 1..8 = labeled operators; 9 = optional release.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

CHANNELS = (
    "authority", "law", "lineage", "word", "stone", "memory"
)
OPERATORS = (
    {"id": 1, "label": "White Pope / Declared Face", "group": "Disclosed Trinity", "role": "public declaration"},
    {"id": 2, "label": "Black Pope / Disciplinary Face", "group": "Disclosed Trinity", "role": "discipline and rules"},
    {"id": 3, "label": "Grey Pope / Transitional Face", "group": "Disclosed Trinity", "role": "institutional continuity"},
    {"id": 4, "label": "Operator of Law", "group": "Hidden Pentad", "role": "codes and contracts"},
    {"id": 5, "label": "Operator of Blood", "group": "Hidden Pentad", "role": "ancestry and covenants"},
    {"id": 6, "label": "Operator of Word", "group": "Hidden Pentad", "role": "script and language"},
    {"id": 7, "label": "Operator of Stone", "group": "Hidden Pentad", "role": "sites and physical monuments"},
    {"id": 8, "label": "Operator of Shadow", "group": "Hidden Pentad", "role": "memory and recurrence"},
)
ROWS = (
    {"tier": 1, "name": "Presentation", "operators": [1, 2], "transform": "identity"},
    {"tier": 2, "name": "Governance", "operators": [3, 4], "transform": "rotate-right-1"},
    {"tier": 3, "name": "Transmission", "operators": [5, 6], "transform": "reverse"},
    {"tier": 4, "name": "Recurrence", "operators": [7, 8], "transform": "xor-010101"},
)
MASK = (0, 1, 0, 1, 0, 1)


def parse_bits(value: str) -> tuple[int, ...]:
    if len(value) != 6 or set(value) - {"0", "1"}:
        raise ValueError("Input must be exactly six binary digits (e.g., 101100).")
    return tuple(int(d) for d in value)


def transform(row: int, x: tuple[int, ...]) -> tuple[int, ...]:
    """Four transparent, deterministic toy transformations T_1 ... T_4."""
    if row == 1: return x
    if row == 2: return (x[-1],) + x[:-1]
    if row == 3: return x[::-1]
    if row == 4: return tuple(a ^ b for a, b in zip(x, MASK))
    raise ValueError("Row must be between 1 and 4.")


def phi(column: int, transformed: tuple[int, ...]) -> int:
    """Projection function phi_j: select j-th functional channel."""
    return transformed[column - 1]


def field(x: tuple[int, ...]) -> list[list[int]]:
    return [[phi(j, transform(i, x)) for j in range(1, 7)]
            for i in range(1, 5)]


def field_with_labels(x: tuple[int, ...]) -> list[dict]:
    return [
        {**row, "values": dict(zip(CHANNELS, transform(row["tier"], x))),
         "binary": "".join(map(str, transform(row["tier"], x)))}
        for row in ROWS
    ]


def cycle_step(x: tuple[int, ...]) -> tuple[int, ...]:
    """Feed all four transformations back into the next iteration."""
    for i in range(1, 5):
        x = transform(i, x)
    return x


def trace(seed: tuple[int, ...], steps: int) -> dict:
    states = ["".join(map(str, seed))]
    visited = {seed: 0}
    current = seed
    cycle = None
    for k in range(1, steps + 1):
        current = cycle_step(current)
        states.append("".join(map(str, current)))
        if current in visited:
            cycle = {"start_step": visited[current], "repeat_step": k,
                     "period": k - visited[current]}
            break
        visited[current] = k
    return {"states": states, "detected_cycle": cycle}


def build_report(seed: tuple[int, ...], steps: int) -> dict:
    raw = "".join(map(str, seed))
    return {
        "model_status": "symbolic hypothesis / educational simulation; no historical causation inferred",
        "formula": "M_ij = phi_j(T_i(x))",
        "dimensions": {"matrix_rows": 4, "matrix_columns": 6,
                       "inside_operators": 8, "external_boundaries": [0, 9]},
        "boundary_0": {"name": "Absolute Void / Pure Potential", "raw_seed": raw,
                       "implementation": "input preserved without transformation"},
        "functional_channels": list(CHANNELS),
        "operators": list(OPERATORS),
        "field_4x6": field(seed),
        "rows": field_with_labels(seed),
        "loop": trace(seed, steps),
        "boundary_9": {"name": "Sovereign Singularity / ONE", "result": raw,
                       "implementation": "explicit release to the original input, not a mathematically proven escape"},
        "notes": ["Operator labels are mapped in paired rows for 4x6 accounting; the original 3+5 grouping is retained in metadata.",
                  "The 6 channels are analyst-chosen projections, not six historically documented control channels.",
                  "1+1=2 (build) and 1-1=0 (clear) are interpretive interface rules, not proofs about historical events."]
    }


def write_csv(path: Path, report: dict) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["row", "tier", "paired_operators", *CHANNELS])
        for row in report["rows"]:
            writer.writerow([row["name"], row["tier"], "+".join(map(str, row["operators"])),
                             *[row["values"][c] for c in CHANNELS]])


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--seed", default="101100", help="6-bit feature vector for Matrix 0")
    p.add_argument("--steps", type=int, default=16, help="max feedback steps before cycle detection")
    p.add_argument("--json", type=Path, default=None, help="optional JSON report file")
    p.add_argument("--csv", type=Path, default=None, help="optional CSV report file")
    args = p.parse_args()
    if args.steps < 1: p.error("--steps must be at least 1")
    try: seed = parse_bits(args.seed)
    except ValueError as error: p.error(str(error))
    report = build_report(seed, args.steps)
    print("M_ij = phi_j(T_i(x)) | symbolic 4x6 field")
    print("Matrix 0 input:", args.seed)
    print("row  paired_ops   ", " ".join(CHANNELS))
    for row in report["rows"]:
        print(f"{row['tier']:>3}   {str(row['operators']):12}", "         ".join(row["binary"]))
    print("Feedback:", " -> ".join(report["loop"]["states"]))
    print("Cycle:", report["loop"]["detected_cycle"])
    print("Matrix 9 release:", report["boundary_9"]["result"])
    if args.json:
        args.json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("Wrote JSON:", args.json)
    if args.csv:
        write_csv(args.csv, report)
        print("Wrote CSV:", args.csv)


if __name__ == "__main__":
    main()

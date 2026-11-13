#!/usr/bin/env python3
"""ONE read-only inventory of potential 13-root adoption sites across a repository.

This is an *applicability inventory*, not a vulnerability scanner and not proof
that unflagged software passes the 13 correctness controls. Does not edit files.
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import re

EXTS = {".py", ".js", ".jsx", ".cjs", ".mjs", ".ts", ".tsx", ".sql",
        ".html", ".json", ".yaml", ".yml"}
SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", "__pycache__",
             "vendor", ".venv", "venv", ".turbo", "coverage"}
CANDIDATES = {
    "boundaries_and_origins": re.compile(r"\brange\s*\(|\bfor\s*\(|\.slice\s*\(|\bindexOf\s*\(", re.I),
    "units_and_precision": re.compile(r"\b(?:float|Decimal|parseFloat|Number)\s*\(|\b(?:meters|cents|millis|ms)\b", re.I),
    "ratios_and_denominators": re.compile(r"\b(?:average|mean|ratio|percent|denominator|numerator)\b", re.I),
    "date_and_time": re.compile(r"\b(?:datetime|timestamp|Date|timezone|UTC|setTimeout)\b", re.I),
    "missing_and_state": re.compile(r"\b(?:null|None|undefined|NULL|INSERT|UPDATE|DELETE|sqlite3)\b", re.I),
}
MAX_BYTES = 2_000_000


def audit(root: Path, max_samples: int = 50) -> dict:
    if not root.is_dir():
        raise ValueError("Owner-supplied repository directory must exist")
    scanned, oversize, inaccessible, ignored = 0, 0, 0, 0
    signal_totals = Counter()
    candidate_count = 0
    examples = []
    # rglob would descend into vendor directories: prune explicitly.
    import os
    for directory, subdirs, files in os.walk(root):
        subdirs[:] = sorted(s for s in subdirs if s not in SKIP_DIRS)
        for name in sorted(files):
            path = Path(directory) / name
            if path.suffix.lower() not in EXTS:
                ignored += 1
                continue
            try:
                if not path.is_file() or path.stat().st_size > MAX_BYTES:
                    oversize += 1
                    continue
                content = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                inaccessible += 1
                continue
            scanned += 1
            found = sorted(key for key, pat in CANDIDATES.items() if pat.search(content))
            if found:
                candidate_count += 1
                signal_totals.update(found)
                if len(examples) < max_samples:
                    examples.append({
                        "source_path": str(path.relative_to(root)).replace("\\", "/"),
                        "potential_adoption_areas": found,
                        "audit_status": "needs_module_specific_review_not_proven_defective",
                    })
    return {
        "report_type": "source_adoption_inventory_not_certification",
        "creator_framework": "Fencepost Error Syndrome — by Nathan Tabor",
        "root_control_count": 13,
        "checked_source_files": scanned,
        "source_files_with_potential_adoption_signals": candidate_count,
        "signal_counts": dict(signal_totals),
        "too_large_or_non_file": oversize,
        "not_readable": inaccessible,
        "other_file_types_not_analyzed": ignored,
        "examples": examples,
        "result": "repository-wide compliance UNKNOWN until each applicable module is reviewed and tested",
        "recommendation": "route each candidate to its owner, declare a typed boundary contract, write regression tests, record rollback evidence; do not auto-patch",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    default_root = Path(__file__).resolve().parents[6]
    parser.add_argument("--root", type=Path, default=default_root)
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    report = audit(args.root)
    encoded = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.out:
        args.out.write_text(encoded, encoding="utf-8")
    print(json.dumps({
        k: report[k] for k in (
            "root_control_count", "checked_source_files",
            "source_files_with_potential_adoption_signals",
            "too_large_or_non_file", "not_readable", "result"
        )}, indent=2))


if __name__ == "__main__":
    main()

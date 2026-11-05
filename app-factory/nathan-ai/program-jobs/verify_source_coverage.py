#!/usr/bin/env python3
"""Read-only, per-record source coverage audit for Nathan AI Program Jobs.

Safe default: never execute historical programs, scan networks, or infer release readiness
from filenames. This checks source presence and test-file presence only.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import date
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[3]
CATALOG = Path(__file__).with_name("catalog.json")
SOURCE_SUFFIXES = {".js", ".cjs", ".mjs", ".ts", ".tsx", ".py", ".swift", ".kt", ".java", ".rs", ".sh", ".ino"}
TEST_PATTERN = re.compile(r"(?:^|/)(?:tests?/|test_[^/]+\.py$)|(?:\.test\.[cm]?js$|_test\.py$|\.spec\.[cm]?js$)", re.I)
DOC_SUFFIXES = {".md", ".txt", ".rst"}


def safe_path(root: Path, relative: str) -> Path:
    # Protect an owner-chosen checkout from path traversal in a source register.
    if not isinstance(relative, str) or not relative or relative.startswith(("/", "\\")):
        raise ValueError("Catalog contains an invalid path")
    raw = Path(relative)
    if ".." in raw.parts or raw.is_absolute():
        raise ValueError("Catalog contains a traversal path")
    candidate = (root / raw).resolve()
    if not candidate.is_relative_to(root.resolve()):
        raise ValueError("Catalog source resolves outside checkout")
    return candidate


def audit(root: Path, catalog: dict) -> dict:
    if catalog.get("schema") != "nathan-ai.program-jobs-atlas.v1":
        raise ValueError("Unrecognized atlas catalog")
    result = []
    missing = []
    for record in catalog.get("records", []):
        kind, source = record["kind"], record.get("sourcePath")
        entry = {
            "id": record["id"], "name": record["name"], "job": record["job"], "kind": kind,
            "stage": "not_independently_verified", "sourceFound": False,
            "testFiles": [], "completionVerified": False,
            "nextTask": record.get("nextTask", "Recover original and verify"),
        }
        if kind in {"source-component", "browser-entrypoint", "branch-only-source", "recovered-historical-source"} and source:
            target = safe_path(root, source)
            entry["sourceFound"] = target.is_dir() if kind != "browser-entrypoint" else target.is_file()
            if not entry["sourceFound"] and kind in {"source-component", "browser-entrypoint"}:
                missing.append(record["id"])
                entry["stage"] = "broken_public_source_link"
            elif entry["sourceFound"] and kind == "browser-entrypoint":
                entry["stage"] = "browser_entrypoint_source_present"
            elif entry["sourceFound"]:
                files = [p for p in target.rglob("*") if p.is_file() and p.suffix.lower() in SOURCE_SUFFIXES]
                testfiles = [p.relative_to(root).as_posix() for p in files
                             if TEST_PATTERN.search(p.relative_to(root).as_posix())]
                entry["testFiles"] = sorted(testfiles)
                entry["stage"] = "code_and_test_files_present" if testfiles else "code_present_tests_not_linked"
            else:
                entry["stage"] = "historic_source_not_in_main"
        elif kind == "historical-title":
            entry["stage"] = "historical_name_requires_original_source"
        elif kind == "private-archive-anchor":
            entry["stage"] = "private_archive_not_in_public_checkout"
        elif kind in {"architecture-module", "operation-spec"}:
            entry["stage"] = "design_reference_requires_build_mapping"
        result.append(entry)
    count = Counter(x["stage"] for x in result)
    jobs: dict[str, dict] = {}
    for item in result:
        group = jobs.setdefault(item["job"], {"total": 0, "sourcePresent": 0, "testFilesPresent": 0})
        group["total"] += 1
        group["sourcePresent"] += int(item["sourceFound"])
        group["testFilesPresent"] += int(bool(item["testFiles"]))
    return {
        "schema": "nathan-ai.program-source-coverage.v1",
        "sourceCatalogTree": catalog.get("sourceTree"),
        "method": "static-local-filename-review-no-execution",
        "totals": {"records": len(result), "sourceFound": sum(x["sourceFound"] for x in result),
                   "testFilesPresent": sum(bool(x["testFiles"]) for x in result),
                   "independentlyCompleted": 0, "brokenPublicSourceLinks": len(missing)},
        "stages": dict(count),
        "jobs": jobs,
        "missingSourceIdentifiers": missing,
        "records": result,
        "warning": "Finding source or test filenames does not prove that tests passed, that a program works, or that it was released.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=CATALOG)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--out", type=Path, help="Write a JSON coverage report to this local path")
    parser.add_argument("--check", action="store_true", help="Fail when recorded public source paths are missing")
    args = parser.parse_args(argv)
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    result = audit(args.root, catalog)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({**result["totals"], "stages": result["stages"]}, indent=2))
    if args.check and result["missingSourceIdentifiers"]:
        print("Missing public source IDs: " + ", ".join(result["missingSourceIdentifiers"]), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

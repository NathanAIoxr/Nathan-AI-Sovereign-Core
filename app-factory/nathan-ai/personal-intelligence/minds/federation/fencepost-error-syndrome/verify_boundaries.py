#!/usr/bin/env python3
"""Reproducible local acceptance runner. Writes evidence only to explicit --out."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    repo = next(parent for parent in here.parents
                if (parent / "app-factory/octopus-root/codex.test.cjs").exists())
    commands = [
        [sys.executable, "-m", "unittest", "discover", "-s", str(here), "-p", "test_*.py", "-v"],
        [sys.executable, "-m", "unittest", "discover", "-s", str(here.parent / "technology-v108"), "-p", "test_boundary_contract.py", "-v"],
        [sys.executable, str(here / "boundary_gate.py")],
        ["node", "--check", str(here / "boundary_ui.js")],
        ["node", "--test", str(repo / "app-factory/octopus-root/codex.test.cjs")],
    ]
    results = []
    for command in commands:
        try:
            run = subprocess.run(command, capture_output=True, text=True, timeout=120, cwd=repo)
            output = run.stdout + run.stderr
            result = {"command": command, "passed": run.returncode == 0,
                      "exit_code": run.returncode, "output": output}
        except (OSError, subprocess.TimeoutExpired) as exc:
            result = {"command": command, "passed": False, "output": str(exc)}
        results.append(result)
        print(("PASS " if result["passed"] else "FAIL ") + " ".join(command), flush=True)
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scope": "shared boundary library, local reference API, Tech108 regression, existing Codex integrity",
        "passed": all(result["passed"] for result in results),
        "python_tests": sum(int(match.group(1)) for result in results
                            for match in re.finditer(r"Ran (\d+) tests?", result["output"])),
        "results": results,
        "source_sha256": {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                          for path in sorted(here.iterdir()) if path.suffix in (".py", ".sql", ".js", ".html", ".css", ".json", ".txt", ".md")},
        "deployment": "not deployed; other apps require explicit adoption",
        "postgres": "separate test_booking_ranges.sql; not inferred from SQLite tests"
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2) + "\n")
    if not report["passed"]:
        for result in results:
            if not result["passed"]: print(result["output"])
        raise SystemExit(1)
    print(f"Evidence: {args.out}")


if __name__ == "__main__": main()

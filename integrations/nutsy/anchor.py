"""Generate or verify NUTSY's deterministic BUILD/CLEAR integration receipt."""

import argparse
import hashlib
import hmac
import json
from pathlib import Path


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def make_receipt(catalog):
    if type(catalog) is not dict or catalog.get("schema") != "nutsy.project-catalog.v1":
        raise ValueError("Expected a NUTSY v1 project catalog")
    projects = catalog.get("projects")
    if not isinstance(projects, dict) or not projects:
        raise ValueError("Expected at least one project")
    for name, entry in projects.items():
        if not name or not isinstance(entry, dict) or not entry.get("evidence") or not entry.get("next"):
            raise ValueError(f"Invalid project entry: {name!r}")

    left, right = 0b1, 0b1
    built, cleared = left + right, left - right
    low_bit, carry = left ^ right, left & right
    if (built, cleared, (carry << 1) | low_bit) != (2, 0, 2):
        raise RuntimeError("BUILD/CLEAR arithmetic self-check failed")

    body = {
        "schema": "nutsy.anchor-receipt.v1",
        "build": {"decimal": built, "binary": format(built, "b"), "sum_bit": low_bit, "carry": carry},
        "clear": {"decimal": cleared, "binary": format(cleared, "b"), "difference_bit": left ^ right,
                  "borrow": (1 ^ left) & right},
        "catalog_sha256": hashlib.sha256(canonical(catalog)).hexdigest(),
        "project_count": len(projects),
    }
    return {"id": "nutsy-anchor-" + hashlib.sha256(canonical(body)).hexdigest(), **body}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=Path(__file__).with_name("catalog.json"))
    parser.add_argument("--verify", type=Path, help="compare a saved receipt with the calculated result")
    args = parser.parse_args()
    try:
        receipt = make_receipt(json.loads(args.catalog.read_text(encoding="utf-8")))
        if args.verify:
            submitted = json.loads(args.verify.read_text(encoding="utf-8"))
            if not hmac.compare_digest(canonical(receipt), canonical(submitted)):
                raise ValueError("Receipt does not match the catalog or arithmetic")
    except (OSError, ValueError) as error:
        parser.exit(1, f"{error}\n")
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    main()

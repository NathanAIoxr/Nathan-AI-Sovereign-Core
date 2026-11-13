#!/usr/bin/env python3
"""ONE v496 -- source-preserving, deterministic zero-slide continuity verification.

Creator: Nathan Tabor. Exactly 333 creator-listed new global positions 164..496.
The earlier #1..163 baseline is a prior assertion, not fully re-audited here.
No real hardware, robots, agents, money or remote systems are operated.
"""
from __future__ import annotations

from collections import Counter
import argparse
import hashlib
import json
from pathlib import Path
import re


HERE = Path(__file__).resolve().parent
REGISTRY = HERE / "registry.v496.json"
SOURCE = HERE / "USER_SUPPLIED_2026-11-13.txt"
TECH108 = HERE.parent / "technology-v108" / "registry.tech108.json"
SOURCE_SHA256 = "df17e25d45407f5a75a5c914525692b6501abe16cf8cd4d8d863f62fdf766b4a"

BLOCKS = {
    "boundary": (164, 172, 9),
    "technology": (173, 280, 108),
    "software": (281, 388, 108),
    "hardware": (389, 496, 108),
}


class ContinuityError(ValueError):
    """No silent changes to verified new-number boundaries or creator names."""


def source_entries(source: str) -> list[tuple[int, str, str, int, str]]:
    """Parse the author's numbered source blocks without rewriting them."""
    anchor = "Block A: Boundary-Lock & Fencepost-Elimination Family (#164 – #172)"
    ending = "Next Coordinate Ready"
    if anchor not in source or ending not in source:
        raise ContinuityError("creator source missing start/end marker")
    lines = source[source.index(anchor):source.index(ending)].splitlines()
    layer = "boundary"
    family = 1
    title = "Boundary-Lock & Fencepost-Elimination Family"
    out = []
    for line in lines:
        section = re.match(r"^Block ([BCD]):", line)
        if section:
            layer = {"B": "technology", "C": "software", "D": "hardware"}[section[1]]
            family = 0
            continue
        heading = re.match(
            r"^• (Tech|SW|HW) Family (\d+) — (.+?) \(#(\d+) – #(\d+)\):", line
        )
        if heading:
            family, title = int(heading[2]), heading[3]
            if not (1 <= family <= 12):
                raise ContinuityError("invalid source family ordinal")
            lo, hi = int(heading[4]), int(heading[5])
            if (lo, hi) != (
                BLOCKS[layer][0] + (family - 1) * 9,
                BLOCKS[layer][0] + family * 9 - 1
            ):
                raise ContinuityError("source family bounds don't match declared matrix")
            continue
        if not (line.startswith("• #") or line.startswith("#")):
            continue
        for match in re.finditer(
            r"#(\d+)\s+(.+?)(?=\s*·\s*#\d+|\s*[.]?\s*$)", line
        ):
            number, name = int(match[1]), match[2].strip().removesuffix(".")
            out.append((number, name, layer, family, title))
    return out


def validate(data: dict, source: str, tech: dict) -> dict:
    if not isinstance(data, dict) or data.get("schema") != "nathan.one.federation.continuity.v496":
        raise ContinuityError("unknown/missing v496 schema")
    if hashlib.sha256(source.encode("utf-8")).hexdigest() != SOURCE_SHA256:
        raise ContinuityError("source digest changed; preserve exact creator text")
    canonical = source_entries(source)
    if len(canonical) != 333 or [r[0] for r in canonical] != list(range(164, 497)):
        raise ContinuityError("source must define contiguous 164..496 exactly once")
    if data.get("baseline", {}).get("declared_count") != 163:
        raise ContinuityError("baseline count changed")
    if data.get("rules", {}).get("next_available_global_id") != 497:
        raise ContinuityError("next available id is not 497")
    segments = data.get("blocks", [])
    expect_segments = [
        ("baseline", 1, 163, 163),
        ("boundary", 164, 172, 9),
        ("technology", 173, 280, 108),
        ("software", 281, 388, 108),
        ("hardware", 389, 496, 108),
    ]
    if [
        (s.get("layer"), s.get("first_global_id"),
         s.get("last_global_id"), s.get("count")) for s in segments
    ] != expect_segments:
        raise ContinuityError("segment boundaries changed")
    roles = data.get("minds")
    if not isinstance(roles, list) or len(roles) != 333:
        raise ContinuityError("expected 333 indexed new members")
    if any(type(r.get("global_id")) is not int for r in roles):
        raise ContinuityError("global IDs must be integers")
    if [r["global_id"] for r in roles] != list(range(164, 497)):
        raise ContinuityError("missing/duplicate/out-of-order global ID")
    if len(set(r.get("id") for r in roles)) != 333:
        raise ContinuityError("duplicate federation role key")
    for expected, role in zip(canonical, roles):
        number, name, layer, family, family_title = expected
        offset = {"boundary": 163, "technology": 172, "software": 280, "hardware": 388}[layer]
        expected_fields = {
            "global_id": number,
            "name": name,
            "layer": layer,
            "local_index": number - offset,
            "family_ordinal": family,
            "family_name": family_title,
            "id": f"one-v496-{number:03d}",
            "runtime_status": "indexed_only",
            "external_action": "none",
        }
        for key, value in expected_fields.items():
            if role.get(key) != value:
                raise ContinuityError(f"master #{number}: {key} must equal creator source")
    families = data.get("families")
    if not isinstance(families, list) or len(families) != 37:
        raise ContinuityError("expected one boundary family + 36 stack families")
    seen = set()
    for f in families:
        layer = f.get("layer")
        family = f.get("family_ordinal")
        key = f.get("family_key")
        if layer not in BLOCKS or type(family) is not int:
            raise ContinuityError("family namespace invalid")
        if family not in range(1, 2 if layer == "boundary" else 13):
            raise ContinuityError("family ordinal invalid")
        if key != f"{layer}/{family}" or key in seen:
            raise ContinuityError("family duplicate or inconsistent namespace")
        seen.add(key)
        first = BLOCKS[layer][0] + (family - 1) * 9
        last = first + 8
        if (f.get("first_global_id"), f.get("last_global_id"), f.get("count")) != (first, last, 9):
            raise ContinuityError("family has incorrect inclusive endpoints")
        members = [r for r in roles if r["layer"] == layer and r["family_ordinal"] == family]
        if [r["global_id"] for r in members] != list(range(first, last + 1)):
            raise ContinuityError("family missing member")
    previous = tech.get("minds")
    if not isinstance(previous, list) or len(previous) != 108:
        raise ContinuityError("source Technology-v108 catalog missing")
    observed_tech = [r["name"] for r in roles if r["layer"] == "technology"]
    if observed_tech != [r.get("name") for r in previous]:
        raise ContinuityError("technology local names changed relative to existing Tech108")
    links = data.get("full_stack_alignment")
    if not isinstance(links, list) or len(links) != 108:
        raise ContinuityError("must have 108 positional stack mappings")
    for i, link in enumerate(links):
        if (
            link.get("local_position"),
            link.get("technology_global_id"),
            link.get("software_global_id"),
            link.get("hardware_global_id")
        ) != (i + 1, 173 + i, 281 + i, 389 + i):
            raise ContinuityError("incorrect 3-layer ordinal alignment")
    return {
        "source_sha256": SOURCE_SHA256,
        "creator_positions_verified": len(roles),
        "complete_new_global_range": "164..496",
        "gap_count": 0,
        "duplicate_count": 0,
        "boundary_units": 9,
        "tech_units": 108,
        "software_units": 108,
        "hardware_units": 108,
        "families_checked": len(families),
        "tech108_exact_name_matches": 108,
        "stack_crosswalk_count": len(links),
        "next_available": 497,
        "baseline_1_to_163_verified": False,
        "live_workers_deployed": 0,
        "scope": "creator-declared numbering, naming, and positional mapping only",
    }


def simulation(data: dict, days: int = 7) -> dict:
    if type(days) is not int or not 1 <= days <= 366:
        raise ContinuityError("days must be an integer in 1..366")
    members = set(range(164, 497))
    families = data["families"]
    correct = Counter()
    wrong_missing = Counter()
    wrong_extra = Counter()
    for day in range(days):
        for fam in families:
            first, last = fam["first_global_id"], fam["last_global_id"]
            correct.update((day, uid) for uid in range(first, last + 1))
            wrong_missing.update((day, uid) for uid in range(first, last))
            wrong_extra.update((day, uid) for uid in range(first, last + 2))
    expected = {(d, i) for d in range(days) for i in members}
    def stats(counter):
        return {
            "generated": sum(counter.values()),
            "valid_unique": len(counter.keys() & expected),
            "omitted": len(expected - counter.keys()),
            "duplicate": sum(n - 1 for key, n in counter.items() if key in expected and n > 1),
            "invalid": sum(n for key, n in counter.items() if key not in expected),
        }
    outcomes = {
        "omit_final": stats(wrong_missing),
        "include_extra": stats(wrong_extra),
        "fixed": stats(correct),
    }
    if outcomes["fixed"] != {
        "generated": 333 * days, "valid_unique": 333 * days,
        "omitted": 0, "duplicate": 0, "invalid": 0
    }:
        raise ContinuityError("fixed scheduler failed")
    return {
        "days": days,
        "simulated_only": True,
        "assumption": "one proposed assignment per indexed role per day, not real bot work",
        "scenarios": outcomes,
    }


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--registry", type=Path, default=REGISTRY)
    p.add_argument("--source", type=Path, default=SOURCE)
    p.add_argument("--tech108", type=Path, default=TECH108)
    p.add_argument("--days", type=int, default=7)
    p.add_argument("--out", type=Path)
    args = p.parse_args()
    data = json.loads(args.registry.read_text(encoding="utf-8"))
    source = args.source.read_text(encoding="utf-8")
    tech = json.loads(args.tech108.read_text(encoding="utf-8"))
    result = {"verification": validate(data, source, tech),
              "simulation": simulation(data, args.days)}
    body = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        args.out.write_text(body, encoding="utf-8")
    print(body, end="")


if __name__ == "__main__":
    main()

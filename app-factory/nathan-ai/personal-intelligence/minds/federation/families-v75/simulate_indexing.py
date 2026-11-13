#!/usr/bin/env python3
"""ONE v75: deterministic boundary audit and scheduling comparison.

Local, synthetic workload only. No network, bots, devices or people are controlled.
Run: python3 simulate_indexing.py [--days 7] [--out results.json]
"""
import argparse
from datetime import date, timedelta
import json
from pathlib import Path
import random

HERE = Path(__file__).resolve().parent


def load():
    d = json.loads((HERE / "registry.v75.json").read_text(encoding="utf-8"))
    families = d["families"]
    members = d["minds"]
    assert len(families) == 11 and [x["family_id"] for x in families] == list(range(65,76))
    assert len(members) == 99 and [x["member_id"] for x in members] == list(range(65,164))
    for f in families:
        first, last = f["member_first"], f["member_last"]
        expected = list(range(first,last+1))
        actual = [m["member_id"] for m in members if m["family_id"] == f["family_id"]]
        assert actual == expected and len(actual) == 9, "Incorrect family member bounds"
    assert d["rules"]["inclusive_endpoint"] is True
    return families, members


def property_tests(count=10000, seed=1973):
    r = random.Random(seed)
    for _ in range(count):
        start = r.randrange(0,1_000_000)
        size = r.randrange(1,201)
        end = start + size - 1
        assert len(range(start,end+1)) == size
        assert len(range(start,end)) == size-1
        assert end-start+1 == size
    return {"tested":count,"seed":seed,"all_passed":True}


def simulate(days=7, start=date(2026,11,15)):
    if days < 1 or days > 365:
        raise ValueError("Simulation days must be 1..365")
    families, members = load()
    real = {m["member_id"] for m in members}
    cases = {
        "off_by_one_omission": lambda f: range(f["member_first"], f["member_last"]),
        "off_by_one_overrun": lambda f: range(f["member_first"], f["member_last"]+2),
        "fixed_inclusive_range": lambda f: range(f["member_first"], f["member_last"]+1)
    }
    results = {}
    for label, selector in cases.items():
        unique = missed = duplicates = phantom = attempts = 0
        first_day_examples = None
        for day in range(days):
            seen={}
            for f in families:
                for member_id in selector(f):
                    attempts += 1
                    seen[member_id]=seen.get(member_id,0)+1
            unique += len(real.intersection(seen))
            missed += len(real.difference(seen))
            duplicates += sum(max(0, seen.get(n,0)-1) for n in real)
            phantom += sum(v for n,v in seen.items() if n not in real)
            if day == 0:
                first_day_examples = {
                    "omitted":sorted(real.difference(seen)),
                    "duplicated":sorted(n for n in real if seen.get(n,0)>1),
                    "invalid":sorted(n for n in seen if n not in real)
                }
        results[label]={
          "proposed_attempts":attempts, "unique_valid_role_slots":unique,
          "missed_valid_role_slots":missed, "duplicate_slots":duplicates,
          "invalid_slots":phantom, "first_day_examples":first_day_examples
        }
    expected = 99*days
    assert results["fixed_inclusive_range"]["unique_valid_role_slots"] == expected
    assert not results["fixed_inclusive_range"]["missed_valid_role_slots"]
    assert not results["fixed_inclusive_range"]["duplicate_slots"]
    assert not results["fixed_inclusive_range"]["invalid_slots"]
    return {
      "schema":"nathan.one.federation.v75.index-boundary-simulation.v1",
      "source":"registry.v75.json",
      "synthetic_assumption":"One proposed task per member role per scheduled calendar day",
      "families":11,"members":99,"days":days,
      "first_day":start.isoformat(),
      "last_scheduled_day":(start+timedelta(days=days-1)).isoformat(),
      "exclusive_end_day":(start+timedelta(days=days)).isoformat(),
      "endpoint_dates_if_counted_inclusively":days+1,
      "strictly_between_dates":max(0,days-1),
      "scheduled_role_slots_expected":expected,
      "cases":results,
      "recovered_omitted_slots":results["off_by_one_omission"]["missed_valid_role_slots"],
      "coverage_before_percent":round(100*results["off_by_one_omission"]["unique_valid_role_slots"]/expected,2),
      "coverage_after_percent":100,
      "improvement_over_omission_case_percent":round(100*results["off_by_one_omission"]["missed_valid_role_slots"]/results["off_by_one_omission"]["unique_valid_role_slots"],2),
      "property_tests":property_tests(),
      "real_world_impact":"not measured; synthetic indexing model only",
      "external_actions":0
    }


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--days",type=int,default=7)
    parser.add_argument("--out")
    args=parser.parse_args()
    report=simulate(args.days)
    output=json.dumps(report,ensure_ascii=False,indent=2)
    if args.out:
        Path(args.out).write_text(output+"\n",encoding="utf-8")
    print(output)


if __name__=="__main__":
    main()

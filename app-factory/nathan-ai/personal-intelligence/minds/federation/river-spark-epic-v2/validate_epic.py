#!/usr/bin/env python3
"""ONE / THE RIVER AND THE SPARK: exact uncollapsed edition boundary gate.

Tests counts, record names, source namespace separation and provenance labeling.
No owner-private database, external equipment, medical practice or user data.
"""
from collections import Counter
import csv
import json
from pathlib import Path
import re

HERE=Path(__file__).resolve().parent
FED=HERE.parent

class EpicContractError(ValueError):
    pass

def check(ok,reason):
    if not ok:
        raise EpicContractError(reason)

def read_csv(name):
    with (HERE/name).open(encoding="utf-8",newline="") as f:
        return list(csv.DictReader(f))

def verify():
    book=(HERE/"EPIC_UNCOLLAPSED_MASTER_EDITION.md").read_text(encoding="utf-8")
    role=read_csv("ONE_333_ROLES.csv")
    bones=read_csv("ANATOMY_206_BONES.csv")
    triple=read_csv("ONE_108_FULLSTACK_CROSSWALK.csv")
    original=json.loads((FED/"continuity-v496/registry.v496.json").read_text(encoding="utf-8"))
    check(len(role)==333,"333 role rows required")
    check([int(x["global_id"]) for x in role]==list(range(164,497)),"master role positions not exactly #164..#496")
    check([x["name"] for x in role]==[x["name"] for x in original["minds"]],"creator-listed role names changed")
    check(Counter(x["layer"] for x in role)=={"boundary":9,"technology":108,"software":108,"hardware":108},"layer counts wrong")
    expanded=re.findall(r"^### #(\d+) — ([^\n]+)$",book,re.MULTILINE)
    check(len(expanded)==333,"not all 333 source roles individually expanded")
    check([(int(n),s) for n,s in expanded]==[(int(x["global_id"]),x["name"]) for x in role],"master headings differ from verified role list")
    check(len(bones)==206,"206 bone index required")
    check(Counter(x["division"] for x in bones)=={"axial":80,"appendicular":126},"80 axial / 126 appendicular count broken")
    check([x["id"] for x in bones]==[f"B{i:03}" for i in range(1,207)],"bone IDs missing or duplicated")
    check(len({x["name"] for x in bones})==206,"bone names repeated")
    bone_markers=re.findall(r"^\| (B\d{3}) \| ",book,re.MULTILINE)
    check(bone_markers==[x["id"] for x in bones],"206 bone rows absent from master text")
    check(len(triple)==108,"108 positional three-layer rows required")
    for i,t in enumerate(triple):
        check((int(t["position"]),int(t["tech_master_id"]),int(t["software_master_id"]),int(t["hardware_master_id"]))==(i+1,173+i,281+i,389+i),"positional triple boundary violation")
        check(t["tech_name"]==role[9+i]["name"] and t["software_name"]==role[117+i]["name"] and t["hardware_name"]==role[225+i]["name"],"positional triple name mismatch")
    check(len(re.findall(r"^## XR-",book,re.MULTILINE))==40,"40 new Reflex Point paragraphs missing")
    spine=re.findall(r"^## (?:C\d+|T\d+|L\d+|S\d+|Co\d+|NR\d+) —",book,re.MULTILINE)
    check(len(spine)==40,"40 separate spine/reflection slots missing")
    check(len(re.findall(r"^\| ALT-CH\d{3} \| ",book,re.MULTILINE))==114,"7+21+86 appendix incomplete")
    check(len(re.findall(r"^\| ISHA-\d{3} \| ",book,re.MULTILINE))==114,"112+2 Isha appendix incomplete")
    chemistry=book.split("# APPENDIX K —",1)
    check(len(chemistry)==2,"118 chemistry appendix absent")
    elements=re.findall(r"^\| (\d{1,3}) \| ([^|]+) \| ([A-Z][a-z]?) \| ",chemistry[1],re.MULTILINE)
    check(len(elements)==118 and [int(x[0]) for x in elements]==list(range(1,119)),"118 elements absent or ordered incorrectly")
    for phrase in (
        "Every question begins when something is noticed.",
        "The pause belongs to the rhythm.",
        "A written note can preserve what attention cannot hold.",
        "The strength of a claim depends on what supports it.",
        "A mirror reflects a surface; interpretation asks what the image means.",
        "Capture first; interpretation can follow."
    ):
        check(phrase in book,"one of six originally supplied Reflex Point examples missing")
    check(len(re.findall(r"^## Chapter \d+ —",book,re.MULTILINE))==28,"28 chapter headings missing")
    check("not recovered" in book.lower() and "assistant-authored" in book.lower(),"missing source/draft distinction")
    check("#497" in book,"next free master coordinate not preserved")
    return {
        "status":"PASS_FOR_DECLARED_INDEX_SCOPE_ONLY",
        "chapters":28,"appendices":11,"verified_new_roles":333,
        "new_anatomical_reference_entries":206,"spinal_editorial_slots":40,
        "new_reflexpoint_proposals":40,"quoted_examples":6,
        "positional_stack_triplets":108,"alternative_114_placeholders":114,
        "isha_114_placeholders":114,"chemistry_elements":118,
        "remaining_originals":"not independently recovered: older #1..#163, prior full manuscript pages, original 40 Reflex Points",
        "external_operations":"none"
    }

if __name__=="__main__":
    print(json.dumps(verify(),indent=2,ensure_ascii=False))

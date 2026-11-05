#!/usr/bin/env python3
"""Match a PRIVATE owner-side file inventory against the public Nathan AI program atlas.

Never executes inventoried code, extracts archives, connects to any server, or modifies originals.
All matching is heuristic: candidate != verified build. Output paths may be sensitive; keep private.
"""
from __future__ import annotations
import argparse
import csv
import json
from pathlib import Path
import re
from collections import Counter

STOP = set("nathan tabor ai one core app system engine project original source program software file main index readme module v the and of for in at root archive build private public complete".split())
SRC_FIELDS = ("path", "project_hint", "tags")
MATCH_FIELDS = ["catalog_id","catalog_name","job","record_kind","candidate_path","candidate_kind","candidate_hash","score","origin","result"]
UNMATCH_FIELDS = ["catalog_id","catalog_name","job","record_kind","status","next_task"]

def tokens(s: str) -> set[str]:
    parts = re.findall(r"[a-z0-9]+",str(s).lower())
    return {x for x in parts if len(x) >= 3 and x not in STOP and not x.isdigit()}

def safe_csv_write(path: Path, fields: list[str], rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            # Neutralize CSV spreadsheet formulas in untrusted filenames or notes.
            writer.writerow({k: ("'" + str(r.get(k,"")) if re.match(r"^\s*[=+\-@]",str(r.get(k,""))) else r.get(k,"")) for k in fields})

def candidate_matches(catalog: dict, rows: list[dict], max_per_record: int = 5) -> tuple[list[dict],list[dict]]:
    wanted = [r for r in catalog["records"] if r["kind"] in
              {"historical-title","architecture-module","private-archive-anchor","operation-spec","branch-only-source"}]
    output,unmatched=[],[]
    indexed=[]
    for row in rows:
        path=row.get("path","")
        if not path: continue
        t=tokens(" ".join(row.get(k,"") for k in SRC_FIELDS))
        indexed.append((row,t))
    for record in wanted:
        name_tokens=tokens(record["name"])
        hits=[]
        if not name_tokens:
            unmatched.append(record)
            continue
        for row,cand_tokens in indexed:
            common=name_tokens & cand_tokens
            if len(common)<2 and not (len(name_tokens)==1 and len(common)==1):
                continue
            # Stronger matches cover more distinct original name tokens, not just generic words.
            score=round(len(common)/len(name_tokens),3)
            if score<0.3: continue
            hits.append((score,len(common),row))
        hits.sort(key=lambda x:(-x[0],-x[1],x[2].get("path","")))
        if not hits:
            unmatched.append(record)
            continue
        for score,_,row in hits[:max_per_record]:
            output.append({"catalog_id":record["id"],"catalog_name":record["name"],"job":record["job"],
                           "record_kind":record["kind"],"candidate_path":row.get("path",""),
                           "candidate_kind":row.get("kind",""),"candidate_hash":row.get("sha256",""),
                           "score":score,"origin":row.get("origin",""),"result":"CANDIDATE_NOT_VERIFIED"})
    return output,unmatched

def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog",required=True,type=Path,help="Public job atlas catalog.json")
    parser.add_argument("--inventory",required=True,type=Path,help="Owner-private all_files.csv from recovery scanner")
    parser.add_argument("--out",required=True,type=Path,help="OWNER-PRIVATE output directory")
    args=parser.parse_args()
    out=args.out.expanduser().resolve()
    inp=args.inventory.expanduser().resolve()
    cat=args.catalog.expanduser().resolve()
    if any((out/name) in (inp,cat) for name in ("candidate_matches.csv","still_unmatched.csv","summary.json")):
        parser.error("Output would overwrite a source file")
    data=json.loads(cat.read_text(encoding="utf-8"))
    if data.get("schema")!="nathan-ai.program-jobs-atlas.v1":
        parser.error("Unsupported catalog version")
    with inp.open(newline="",encoding="utf-8-sig") as f:
        reader=csv.DictReader(f)
        if not reader.fieldnames or not set(SRC_FIELDS).issubset(set(reader.fieldnames)):
            parser.error("Inventory CSV is missing required columns")
        rows=list(reader)
    matches,unmatched=candidate_matches(data,rows)
    out.mkdir(parents=True,exist_ok=True)
    safe_csv_write(out/"candidate_matches.csv",MATCH_FIELDS,matches)
    safe_csv_write(out/"still_unmatched.csv",UNMATCH_FIELDS,[{"catalog_id":r["id"],"catalog_name":r["name"],
             "job":r["job"],"record_kind":r["kind"],"status":r["status"],"next_task":r["nextTask"]} for r in unmatched])
    covered=len({m["catalog_id"] for m in matches})
    detail={"catalog_source_tree":data.get("sourceTree"),"inventory_rows_scanned":len(rows),
            "recovery_records_considered":len(matches and {m["catalog_id"] for m in matches} or set())+len(unmatched),
            "records_with_local_candidates":covered,"records_without_candidates":len(unmatched),
            "candidate_matches":len(matches),"verification":"NONE — local filename-token candidates only",
            "privacy":"Output may contain private paths; do not upload to a public repository"}
    (out/"summary.json").write_text(json.dumps(detail,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(detail,indent=2))

if __name__=="__main__":
    main()

#!/usr/bin/env python3
"""NATHAN AI — ONE DATABASE FEDERATION v074 · 48-family source-first codex.

Additive successor to the distinct v21 and v40 editions. All 48 families are
indexed and assigned inspectable source-driven work cards. No speculative
archetype becomes a real autonomous agent by registry insertion.
"""
from __future__ import annotations

import argparse
from contextlib import closing
import json
from pathlib import Path
import sys
import uuid

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/"families-v40"))
import families_v40 as previous

core=previous.core
REGISTRY=HERE/"registry.v48.json"
SOURCE=HERE/"USER_SUPPLIED_FIGURATIVE_FAMILIES_41_48.md"
POLICY=(19,20,21,35,42,43,46,47)
FAMILY_COUNT=48
SOURCE_STATUS={
    "editorial_crosswalk","creator_supplied","source_excerpt_restored",
    "partial_source_excerpt","user_supplied_prior_assistant_text"
}

def load_registry(path=REGISTRY):
    root=json.loads(Path(path).read_text(encoding="utf-8"))
    if root.get("schema")!="nathan.one.federation.worker-families.v48":
        raise ValueError("Expected the 48-family source-based schema")
    items=root.get("minds")
    if not isinstance(items,list) or len(items)!=FAMILY_COUNT:
        raise ValueError("Expected exactly 48 family records")
    if [x.get("family_id") for x in items]!=list(range(1,49)):
        raise ValueError("Family slots must be 1..48, ordered and unique")
    if (items[20].get("name")!="ONE" or
        items[20].get("author_verbatim")!=core.load_registry()["minds"][20]["author_verbatim"]):
        raise ValueError("Family 21 ONE author statement must not be rewritten")
    ancestor=previous.load_registry()["minds"]
    for i in list(range(0,21))+list(range(33,40)):
        if core.canonical(items[i])!=core.canonical(ancestor[i]):
            raise ValueError("Prior source-defined or existing crosswalk changed at "+str(i+1))
    for i in range(21,33):
        x=items[i]
        if x.get("source_class") not in ("source_excerpt_restored","partial_source_excerpt"):
            raise ValueError("22..33 need source-excerpt provenance")
        if not x.get("author_verbatim") or not x.get("source_provenance"):
            raise ValueError("Restored excerpt must expose actual supplied text")
        if not x.get("keywords"):
            raise ValueError("Restored family must be narrowly routable")
        if i==28 and x.get("source_class")!="partial_source_excerpt":
            raise ValueError("Family 29 individual detail is limited to a matrix row")
    for i in range(40,48):
        x=items[i]
        if x.get("source_class")!="user_supplied_prior_assistant_text":
            raise ValueError("Figurative source classification must be explicit")
        if not all(x.get(field) for field in
                   ("name","figurative_lineage","mission","micro_design","macro_design",
                    "author_verbatim","bounded_software_analogue","keywords")):
            raise ValueError("Figurative Family "+str(i+1)+" missing source detail")
    if any(x.get("source_class") not in SOURCE_STATUS for x in items):
        raise ValueError("Unknown source provenance label")
    return root

def bootstrap(db,registry=REGISTRY):
    root=load_registry(registry)
    old=previous.bootstrap(db)  # Retain immutable predecessor source and versions.
    fed=core.ingest(db,registry)
    created=0
    for item in root["minds"]:
        serial=core.canonical(item)
        checksum=core.digest(serial)
        before=db.total_changes
        db.execute("""INSERT OR IGNORE INTO one_worker_family_versions
          (family_id,definition_sha256,source_class,exact_json,first_indexed_at)
          VALUES(?,?,?,?,?)""",
          (item["family_id"],checksum,item["source_class"],serial,core.now()))
        created+=int(db.total_changes>before)
        db.execute("""INSERT INTO one_worker_family_current
          (family_id,definition_sha256) VALUES(?,?)
          ON CONFLICT(family_id) DO UPDATE SET definition_sha256=excluded.definition_sha256""",
          (item["family_id"],checksum))
    db.execute("""INSERT INTO one_worker_family_audit(at,action,detail_json)
      VALUES(?,?,?)""",
      (core.now(),"v48_bootstrap",
       core.canonical({"slots":48,"new_versions":created,"source_provenance":root["source_materials"],
                       "owner_approval_required":True,"external_execution":False})))
    db.commit()
    return {
      "indexed_family_slots":48,
      "restored_from_supplied_excerpt":12,
      "partial_family_29":True,
      "new_figurative_families":8,
      "family21":"ONE",
      "new_versions":created,
      "prior_40_snapshot_kept":True,
      "federation":fed,
      "external_workers_started":0,
      "previous_edition_indexed":old["indexed_family_slots"]
    }

def propose(db,title,context="",work_class="maintenance",scope="local_simulation"):
    if not isinstance(title,str) or not title.strip() or len(title)>500:
        raise ValueError("Title must contain 1–500 characters")
    if not isinstance(context,str) or len(context)>3000:
        raise ValueError("Context can have at most 3,000 characters")
    if work_class not in core.WORK_CLASSES or scope not in core.SCOPES:
        raise ValueError("Unknown work class or authorization scope")
    active=core.active_families(db)
    if len(active)!=48:
        raise ValueError("Bootstrap the 48-family source registry first")
    matches=core.rank(title+" "+context,active)
    state=("blocked" if scope=="third_party" else
           "review_required" if scope=="unknown" else "proposed")
    justification={
      "matched_words":{str(i):kw for i,score,kw in matches},
      "sources":"v21+v40 original source records retained; v48 additions are source-linked",
      "family_29":"Only summary row found; extra capabilities not invented",
      "family_21":"ONE — equal standing, mutual respect, consent, and owner veto",
      "figurative_layer":"Analogy and meaning-making; no unverified mind reading",
      "control":"No external action without explicit separate permission",
      "execution":"none; pending human review"
    }
    task_id="ONE-48-"+uuid.uuid4().hex[:14]
    db.execute("""INSERT INTO one_worker_family_task_proposals
      (task_id,created_at,title,context,work_class,scope,primary_family,
       ranked_families_json,policy_families_json,approval_required,state,reasoning_json)
      VALUES(?,?,?,?,?,?,?,?,?,1,?,?)""",
      (task_id,core.now(),title,context,work_class,scope,matches[0][0],
       core.canonical([i for i,score,k in matches]),
       core.canonical(POLICY),state,core.canonical(justification)))
    db.execute("INSERT INTO one_worker_family_audit(at,action,detail_json) VALUES(?,?,?)",
               (core.now(),"v48_proposal",core.canonical({"id":task_id,"state":state})))
    db.commit()
    return {"id":task_id,"state":state,
            "primary_family":matches[0][0],
            "ranked_families":[i for i,score,k in matches],
            "policy_families":list(POLICY),
            "owner_approval_required":True,
            "external_execution":False,
            "justification":justification}

def status(db):
    base=core.status(db)
    active=core.active_families(db)
    base.update({
      "expected_family_slots":48,
      "indexed_source_records":len(active),
      "restored_historical_and_scifi_excerpts":sum(
        f.get("source_class") in ("source_excerpt_restored","partial_source_excerpt")
        for f in active),
      "partial_source_records":sum(f.get("source_class")=="partial_source_excerpt" for f in active),
      "figurative_families":sum(f.get("source_class")=="user_supplied_prior_assistant_text" for f in active),
      "inherited_editorial_crosswalks":sum(f.get("source_class")=="editorial_crosswalk" for f in active),
      "external_workers_deployed_by_this_module":0
    })
    return base

def build_workpacks(db,out_dir):
    active=core.active_families(db)
    if len(active)!=48:
        raise ValueError("Index all 48 family records before building workpacks")
    target=Path(out_dir)
    target.mkdir(parents=True,exist_ok=True)
    counts={}
    for x in active:
        role=x["family_id"]
        source=x["source_class"]
        counts[source]=counts.get(source,0)+1
        pack={
          "family_id":role,
          "name":x["name"],
          "source_provenance":source,
          "registered":True,
          "source_sha256":core.digest(core.canonical(x)),
          "domain":x.get("domain",""),
          "source_mission":x.get("mission"),
          "mechanical_role":"source-index, issue-triage, or authorized proposal routing",
          "output_status":"work_card_created; not external action or finished project",
          "owner_approval_required":True,
          "family21_policy_applies":True,
          "source_excerpt_complete":source!="partial_source_excerpt"
        }
        (target/f"FAMILY_{role:02d}.json").write_text(
          json.dumps(pack,ensure_ascii=False,indent=2,sort_keys=True)+"\n",
          encoding="utf-8")
    if len(list(target.glob("FAMILY_[0-9][0-9].json")))!=48:
        raise ValueError("Exactly 48 source-linked work cards required")
    report={
      "family_workcards":48,
      "new_figurative_workcards":8,
      "family21":"ONE",
      "source_records_by_class":counts,
      "all_workcards_source_hashed":True,
      "outbound_external_actions":0,
      "automated_file_restorations":0,
      "original_codex_files_changed":0,
      "source_edition":"v48 successor; v21 and v40 unchanged",
      "incomplete_source_details":["Family 29 individual micro and macro description"],
      "implementation_truth":"Workcards and proposal routing built; mythical/figurative abilities not deployed"
    }
    (target/"MANIFEST.json").write_text(
      json.dumps(report,ensure_ascii=False,indent=2,sort_keys=True)+"\n",
      encoding="utf-8")
    return report

def main():
    p=argparse.ArgumentParser(description="NATHAN AI ONE v074 · 48-family codex")
    p.add_argument("--db",default="ONE_Federation_Master.sqlite3")
    sub=p.add_subparsers(dest="command",required=True)
    sub.add_parser("bootstrap")
    sub.add_parser("status")
    route=sub.add_parser("route")
    route.add_argument("title")
    route.add_argument("--context",default="")
    route.add_argument("--work-class",choices=core.WORK_CLASSES,default="maintenance")
    route.add_argument("--scope",choices=core.SCOPES,default="local_simulation")
    packs=sub.add_parser("build")
    packs.add_argument("--out",required=True)
    args=p.parse_args()
    with closing(core.open_main(args.db)) as db:
        if args.command=="bootstrap":result=bootstrap(db)
        elif args.command=="status":result=status(db)
        elif args.command=="route":result=propose(db,args.title,args.context,args.work_class,args.scope)
        else:result=build_workpacks(db,args.out)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()

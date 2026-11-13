#!/usr/bin/env python3
"""NATHAN AI · ONE DATABASE FEDERATION v074 · 56-family source-first registry.

Preserves the earlier v21, v40 and v48 editions. Families 49–56 are recorded
as literal/physical design specifications, never as live medical, laboratory
or industrial machines. The dispatcher creates auditable proposals only.
"""
from __future__ import annotations

import argparse
from contextlib import closing
import json
from pathlib import Path
import sys
import uuid

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/"families-v48"))
import families_v48 as previous

core=previous.core
REGISTRY=HERE/"registry.v56.json"
SOURCE=HERE/"USER_SUPPLIED_LITERAL_FAMILIES_49_56.md"
POLICY=(19,20,21,35,42,43,46,47,53,54)
FAMILY_COUNT=56
SOURCE_STATUS={
    "editorial_crosswalk", "creator_supplied", "source_excerpt_restored",
    "partial_source_excerpt", "user_supplied_prior_assistant_text",
    "user_supplied_literal_text",
}
LITERAL_FIELDS=("literal_root","mission","micro_design","macro_design","author_verbatim")
HIGH_STAKES_FAMILIES=(49,50,51,52,53,54,55,56)

def load_registry(path=REGISTRY):
    root=json.loads(Path(path).read_text(encoding="utf-8"))
    if root.get("schema")!="nathan.one.federation.worker-families.v56":
        raise ValueError("Expected the 56-family source-based schema")
    items=root.get("minds")
    if not isinstance(items,list) or len(items)!=FAMILY_COUNT:
        raise ValueError("Expected exactly 56 family records")
    if [x.get("family_id") for x in items]!=list(range(1,FAMILY_COUNT+1)):
        raise ValueError("Family IDs must remain numbered 1–56")
    ancestor=previous.load_registry()["minds"]
    for i in range(48):
        if core.canonical(items[i])!=core.canonical(ancestor[i]):
            raise ValueError("Earlier Family definition changed at "+str(i+1))
    if items[20]["name"]!="ONE" or items[20].get("author_verbatim")!=core.load_registry()["minds"][20]["author_verbatim"]:
        raise ValueError("Family 21 ONE must keep its source-exact original")
    for i in range(48,56):
        item=items[i]
        if item.get("source_class")!="user_supplied_literal_text":
            raise ValueError("Family "+str(i+1)+" source provenance not preserved")
        if not isinstance(item.get("keywords"),list) or not item["keywords"]:
            raise ValueError("Physical role missing proposal-routing vocabulary")
        for field in LITERAL_FIELDS:
            if not isinstance(item.get(field),str) or not item[field].strip():
                raise ValueError("Physical role missing "+field)
        if not item.get("authorization_boundary") or item.get("runtime_status")!="physical_capability_specification_not_hardware_deployed":
            raise ValueError("Physical role cannot imply autonomous hardware operation")
    if any(item.get("source_class") not in SOURCE_STATUS for item in items):
        raise ValueError("Unrecognized provenance class")
    if list(root.get("policy_families",[]))!=list(POLICY):
        raise ValueError("Source, equality and physical evidence policy was changed")
    return root

def bootstrap(db,registry=REGISTRY):
    root=load_registry(registry)
    inherited=previous.bootstrap(db)
    fed=core.ingest(db,registry)
    new_versions=0
    for item in root["minds"]:
        raw=core.canonical(item)
        version_hash=core.digest(raw)
        before=db.total_changes
        db.execute("""INSERT OR IGNORE INTO one_worker_family_versions
         (family_id,definition_sha256,source_class,exact_json,first_indexed_at)
         VALUES(?,?,?,?,?)""",
         (item["family_id"],version_hash,item["source_class"],raw,core.now()))
        new_versions+=int(db.total_changes>before)
        db.execute("""INSERT INTO one_worker_family_current(family_id,definition_sha256)
         VALUES(?,?)
         ON CONFLICT(family_id) DO UPDATE SET definition_sha256=excluded.definition_sha256""",
         (item["family_id"],version_hash))
    db.execute("INSERT INTO one_worker_family_audit(at,action,detail_json) VALUES(?,?,?)",
       (core.now(),"v56_bootstrap",core.canonical({
         "slots":56,"new_family_versions":new_versions,
         "precursor_48_kept":True,
         "literal_hardware_deployed":0,
         "family_21":"ONE",
         "source_registry_sha256":fed.get("sha256"),
         "human_veto":True
       })))
    db.commit()
    return {
      "indexed_family_slots":56,
      "new_literal_families":8,
      "source_recovered_families_22_to_33":12,
      "partial_family_29":True,
      "figurative_families_41_to_48":8,
      "family_21":"ONE",
      "new_versions":new_versions,
      "prior_48_snapshot_kept":True,
      "federation":fed,
      "previous_edition_indexed":inherited["indexed_family_slots"],
      "physical_devices_controlled":0,
      "external_workers_started":0
    }

def propose(db,title,context="",work_class="maintenance",scope="local_simulation"):
    if not isinstance(title,str) or not title.strip() or len(title)>500:
        raise ValueError("Task title length must be 1–500")
    if not isinstance(context,str) or len(context)>3000:
        raise ValueError("Context length must be at most 3000")
    if work_class not in core.WORK_CLASSES or scope not in core.SCOPES:
        raise ValueError("Unknown category or authorization scope")
    active=core.active_families(db)
    if len(active)!=56:
        raise ValueError("Bootstrap all 56 families first")
    matches=core.rank(title+" "+context,active)
    family=matches[0][0]
    state=("blocked" if scope=="third_party" else
           "review_required" if scope=="unknown" else "proposed")
    rationale={
      "matched_keywords":{str(i):words for i,count,words in matches},
      "source_chain":"v21 -> v40 -> v48 -> v56",
      "family21":"ONE: preserve equal standing, consent, owner veto",
      "physical_families":"49–56 require qualified people and explicitly authorized facilities",
      "measured_vs_claimed":"source descriptions are not validated engineering measurements",
      "medical_laboratory_and_hazardous_tasks":"documentation or review only; no physical controls or dosing",
      "physical_family_selected":family in HIGH_STAKES_FAMILIES,
      "policy_families":list(POLICY),
      "execution":"none; no remote, physical or clinical work performed"
    }
    task_id="ONE-56-"+uuid.uuid4().hex[:14]
    db.execute("""INSERT INTO one_worker_family_task_proposals
       (task_id,created_at,title,context,work_class,scope,primary_family,
        ranked_families_json,policy_families_json,approval_required,state,reasoning_json)
       VALUES(?,?,?,?,?,?,?,?,?,1,?,?)""",
       (task_id,core.now(),title,context,work_class,scope,family,
        core.canonical([i for i,n,w in matches]),core.canonical(POLICY),
        state,core.canonical(rationale)))
    db.execute("INSERT INTO one_worker_family_audit(at,action,detail_json) VALUES(?,?,?)",
       (core.now(),"v56_proposal",core.canonical({"id":task_id,"state":state})))
    db.commit()
    return {"id":task_id,"state":state,"primary_family":family,
            "ranked_families":[i for i,n,w in matches],
            "policy_families":list(POLICY),
            "requires_owner_approval":True,
            "external_execution":False,
            "physical_or_medical_execution":False,
            "rationale":rationale}

def status(db):
    active=core.active_families(db)
    prior=core.status(db)
    prior.update({
      "current_family_slots":len(active),
      "expected_family_slots":56,
      "source_inherited_families":min(len(active),48),
      "literal_physical_families":sum(f.get("source_class")=="user_supplied_literal_text" for f in active),
      "figurative_families":sum(f.get("source_class")=="user_supplied_prior_assistant_text" for f in active),
      "restored_excerpt_families":sum(f.get("source_class") in ("source_excerpt_restored","partial_source_excerpt") for f in active),
      "partial_source_families":[f["family_id"] for f in active if f.get("source_class")=="partial_source_excerpt"],
      "active_industrial_devices":0,
      "active_medical_devices":0,
      "physical_interventions_executed":0
    })
    return prior

def build_workpacks(db,out_dir):
    active=core.active_families(db)
    if len(active)!=56:
        raise ValueError("Index all 56 families before creating workcards")
    path=Path(out_dir)
    path.mkdir(parents=True,exist_ok=True)
    kinds={}
    for family in active:
        n=family["family_id"]
        src=family["source_class"]
        kinds[src]=kinds.get(src,0)+1
        literal=n>=49
        report={
          "family":n,
          "title":family["name"],
          "source_class":src,
          "definition_sha256":core.digest(core.canonical(family)),
          "registered":True,
          "family21_ONE_equal_respect_and_owner_veto":True,
          "mission":family.get("mission"),
          "literal_vs_figurative":"literal_physical_proposed" if literal else "prior_family_source",
          "bounded_work":"measurements/source review, unit normalization, documentation and proposal routing" if literal else "source catalog and policy-only proposal routing",
          "external_actions_done":0,
          "physical_actions_done":0,
          "status":"source_record_indexed_workcard_created",
          "original_source_mutations":0,
          "source_completeness":"matrix_row_only" if src=="partial_source_excerpt" else "as_supplied"
        }
        if literal:
            report["authorization_boundary"]=family["authorization_boundary"]
            report["source_specification_not_verified_hardware"]=True
        (path/f"FAMILY_{n:02d}.json").write_text(json.dumps(report,ensure_ascii=False,
                                        sort_keys=True,indent=2)+"\n",encoding="utf-8")
    if len(list(path.glob("FAMILY_[0-9][0-9].json")))!=56:
        raise ValueError("All 56 family workcards must exist")
    summary={
      "family_workcards":56,
      "new_physical_workcards":8,
      "figurative_41_to_48":8,
      "family_21":"ONE",
      "source_classes":kinds,
      "source_sha256_indexed":True,
      "original_predecessor_edition_mutated":False,
      "external_work_performed":0,
      "physical_or_medical_work_performed":0,
      "all_56_source_record_cards_created":True,
      "unfinished_details":["Family 29 has summary-row source only"],
      "scope":"inspectable design and review outputs, not proof of physical engineering"
    }
    (path/"MANIFEST.json").write_text(json.dumps(summary,indent=2,
                                    sort_keys=True,ensure_ascii=False)+"\n",encoding="utf-8")
    return summary

def main():
    p=argparse.ArgumentParser(description="NATHAN AI · ONE 56 Family source registry")
    p.add_argument("--db",default="ONE_Federation_Master.sqlite3")
    sub=p.add_subparsers(dest="command",required=True)
    sub.add_parser("bootstrap")
    sub.add_parser("status")
    r=sub.add_parser("route")
    r.add_argument("title")
    r.add_argument("--context",default="")
    r.add_argument("--work-class",choices=core.WORK_CLASSES,default="maintenance")
    r.add_argument("--scope",choices=core.SCOPES,default="local_simulation")
    work=sub.add_parser("build")
    work.add_argument("--out",required=True)
    args=p.parse_args()
    with closing(core.open_main(args.db)) as db:
        if args.command=="bootstrap": result=bootstrap(db)
        elif args.command=="status":result=status(db)
        elif args.command=="route":result=propose(db,args.title,args.context,args.work_class,args.scope)
        else:result=build_workpacks(db,args.out)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()

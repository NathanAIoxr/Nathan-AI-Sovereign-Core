#!/usr/bin/env python3
"""Nathan AI / THE RIVER AND THE SPARK cross-index invariants.

Protects namespaced counts, 25 source-statused records, proposed links, 40 *new*
draft prompts, ONE's existing 108 technology names and 333 creator-listed
new global IDs 164..496. Does not purport to verify unseen original 59-page
manuscripts or medical claims.
"""
from __future__ import annotations

from collections import Counter
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
FED = HERE.parent
SOURCE_SHA = "fce7b5b740177ef2c3b82508b3f504f080119bd65965fd3f24ece5ba833576b1"


class CompilationError(ValueError):
    """Fail closed on mismatched scopes, missing content or false equivalence."""


def load(name: str) -> dict:
    return json.loads((HERE / name).read_text(encoding="utf-8"))


def require(condition: bool, problem: str) -> None:
    if not condition:
        raise CompilationError(problem)


def validate_crosswalk(cross: dict) -> None:
    require(cross.get("schema") == "nathan.one.master-crosswalk.v1", "crosswalk schema")
    require(cross.get("source_upload_sha256") == SOURCE_SHA, "upload digest metadata")
    machines = {r["id"]: r for r in cross["machine"]}
    manuscripts = {r["id"]: r for r in cross["manuscript"]}
    require(len(machines) == 5 and len(manuscripts) == 9, "missing or duplicate domains")
    require(machines["one-v496"]["count"] == 496, "ONE global count")
    require(machines["one-v496"]["verified_new_count"] == 333, "new master count")
    require(machines["one-v496"]["verified_new_start"] == 164, "new master start")
    require(machines["one-v496"]["verified_new_last"] == 496, "new master end")
    require(machines["tech108"]["families"] * machines["tech108"]["per_family"] == 108, "Tech108")
    require(machines["root13"]["count"] == 13, "root controls count")
    require(machines["dimension70"]["dimensions"] * machines["dimension70"]["functions_each"] == 630, "dimension count")
    require(manuscripts["bones"]["count"] == 206, "bone count")
    require(manuscripts["spinal"]["count"] == 40, "editorial spine count")
    require(sum(manuscripts["spinal"]["parts"].values()) == 40, "33+7 breakdown")
    require(manuscripts["editorial"]["count"] == 206 + 40 == 246, "206+40 index")
    require(manuscripts["reflex"]["quoted_exact_examples_available"] == 6, "known excerpt count")
    require(manuscripts["reflex"]["originals_not_available"] == 40 - 6, "missing earlier texts")
    require(manuscripts["reflex"]["new_drafts"] == 40, "new draft count")
    require(manuscripts["himalayan14"]["parts"]["upper"] + manuscripts["himalayan14"]["parts"]["lower"] == 14, "14 model")
    require(manuscripts["isha114"]["parts"]["within"] + manuscripts["isha114"]["parts"]["outside"] == 114, "Isha 114")
    require(sum(manuscripts["alternative114"]["parts"].values()) == 114, "alternative 114")
    require(manuscripts["vertical"]["count"] == 7, "seven stations")
    require(manuscripts["tantra12"]["count"] == 12, "twelve vowels")
    require("not" in cross["rule"].lower(), "must explicitly prevent equal-number identity claims")


def validate_reflex(data: dict) -> None:
    require(data.get("schema") == "nathan.one.editorial.reflexpoint-drafts.v1", "draft schema")
    entries = data.get("entries")
    require(isinstance(entries, list) and len(entries) == 40, "need 40 NEW draft prompts")
    require(len({x.get("proposal_id") for x in entries}) == 40, "duplicate new prompt key")
    require(len({x.get("editorial_slot") for x in entries}) == 40, "duplicate editorial slot")
    require(all(x.get("source_status") == "new_assistant_drafted_proposal_not_original_recovered_reflex_point" for x in entries), "new prompt misattributed as source original")
    require(all(isinstance(x.get("text"), str) and x["text"].strip() for x in entries), "empty new prompt")
    require(Counter(x["section"] for x in entries) == data["components"], "draft counts per editorial segment")
    require(data["source_excerpt_original_examples_count"] == 6, "known source examples")
    for prefix, count in [("C",7),("T",12),("L",5),("S",5),("Co",4),("NR",7)]:
        require(all(f"XR-{prefix}{i}" in {x["proposal_id"] for x in entries}
                    for i in range(1,count+1)), f"missing {prefix} drafts")


def validate_pack(pack: dict, cross: dict) -> None:
    require(pack.get("schema") == "nathan.one.federation.knowledge.v074", "must use existing ONE knowledge schema")
    require(pack.get("uploaded_file_sha256") == SOURCE_SHA, "pack source digest metadata")
    rows = pack.get("records")
    edges = pack.get("links")
    require(isinstance(rows, list) and len(rows) >= 20, "incomplete knowledge nodes")
    require(isinstance(edges, list) and len(edges) >= 20, "incomplete crosswalk links")
    ids = [x["id"] for x in rows]
    require(len(set(ids)) == len(ids), "duplicate knowledge ID")
    require(all(isinstance(x.get("title"), str) and x["title"].strip()
                and isinstance(x.get("exact_text"), str) and x["exact_text"].strip()
                and isinstance(x.get("evidence_status"), str) and x["evidence_status"].strip()
                and x.get("privacy") == "public" for x in rows), "missing source metadata")
    require(all(x.get("provenance") and x.get("source_locator") for x in rows), "no untraceable record")
    observed_pairs = set()
    for edge in edges:
        require(edge.get("left") in ids and edge.get("right") in ids, "unknown edge endpoint")
        key = (edge["left"], edge["right"], edge.get("relation"))
        require(key not in observed_pairs, "duplicate same-kind edge")
        require(edge.get("state") == "proposed", "cannot auto-promote cross-domain link")
        observed_pairs.add(key)
    require(pack["records"][0]["id"] == "river-spark-project", "stable knowledge root")
    require(len(rows) == 25 and len(edges) == 27, "pinned version-one record totals")
    require(len(cross["new_drafts"]) == 4, "must keep Book III + Parts X-XII")


def validate_existing_repo() -> dict:
    continuity = json.loads((FED / "continuity-v496" / "registry.v496.json").read_text(encoding="utf-8"))
    tech = json.loads((FED / "technology-v108" / "registry.tech108.json").read_text(encoding="utf-8"))
    roots = json.loads((FED / "fencepost-error-syndrome" / "root13-workers.json").read_text(encoding="utf-8"))
    roles = continuity["minds"]
    require([r["global_id"] for r in roles] == list(range(164, 497)), "ONE v496 new IDs not contiguous")
    require(len(continuity["full_stack_alignment"]) == 108, "wrong cross-layer ordinal count")
    require(len(roots["minds"]) == 13, "Root13 catalog mismatch")
    names = [r["name"] for r in roles if r["layer"] == "technology"]
    require(names == [r["name"] for r in tech["minds"]], "creator technology names changed")
    return {"new_master_ids": len(roles), "technological_names_checked": len(names),
            "root13_roles_checked": len(roots["minds"]), "new_range": [164, 496]}


def validate_all() -> dict:
    cross = load("master_crosswalk.json")
    points = load("NEW_REFLEX_POINT_DRAFTS_40.json")
    pack = load("knowledge_pack.v074.json")
    validate_crosswalk(cross)
    validate_reflex(points)
    validate_pack(pack, cross)
    repo = validate_existing_repo()
    return {
        "status": "pass_for_declared_scope_only",
        "source_attachment_sha256_metadata": SOURCE_SHA,
        "source_attachment_bytes_present_in_repository": False,
        "editorial_entries_declared": 246,
        "reproduced_existing_reflex_examples": 6,
        "new_reflex_drafts_checked": 40,
        "knowledge_records_checked": len(pack["records"]),
        "cross_references_checked": len(pack["links"]),
        "new_editorial_parts": len(cross["new_drafts"]),
        "repo_checks": repo,
        "limitation": "unseen 59-page earlier manuscript, entire 1..163 baseline and every historical code module not reverified here",
    }


def main() -> None:
    print(json.dumps(validate_all(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

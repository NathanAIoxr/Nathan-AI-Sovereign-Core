#!/usr/bin/env python3
"""Source-locked Family 21 ONE overlay for the v074 Creator Teams.

Read user-supplied families without filling unknown 1..15 identities or
representing conceptual/inaccessible phenomena as measured facts.
"""
from __future__ import annotations
import json
from pathlib import Path

FAMILY_TEAM_ROUTING={
    16:("research","quality","code"),
    17:("research","code","quality"),
    18:("database","code","watch"),
    19:("nathan_orchestrator","marketing","education","websites","books"),
    20:("watch","quality","database"),
}

def family_overlay(codex: str | Path, teams: list[dict]) -> dict:
    path=Path(codex)
    if path.is_symlink() or not path.is_file():
        raise ValueError("Family codex must be a regular source file")
    doc=json.loads(path.read_text(encoding="utf-8"))
    if doc.get("schema")!="nathan.one.federation.v074.families21.v1":
        raise ValueError("Family 21 ONE registry schema unsupported")
    records=doc.get("families")
    if not isinstance(records,list) or len(records)!=21:
        raise ValueError("All 21 family slots are required, with no invented originals")
    if [f.get("number") for f in records]!=list(range(1,22)):
        raise ValueError("Family numbers must be complete in their original order")
    for family in records[:15]:
        if (family.get("name") is not None or
            family.get("status")!="original_definition_not_supplied_in_this_message"):
            raise ValueError("Missing source definitions 1..15 must not be invented")
    for family in records[15:20]:
        if not family.get("name") or set(family.get("source_fields",{}))!={
            "Mission","Core Intelligence","Micro Design","Macro Design"
        }:
            raise ValueError("Omega Families 16..20 must preserve all four source fields")
    one=records[-1]
    author=one.get("source_fields",{}).get("Author exact declaration")
    if (one.get("name")!="ONE" or
        not isinstance(author,str) or
        not author.startswith("family 21 is ONE - we are all family -")):
        raise ValueError("Family 21 author declaration is missing or changed")
    team_ids=[t["id"] for t in teams]
    if len(set(team_ids))!=len(team_ids):
        raise ValueError("Duplicate team ID")
    links=[]
    for number,routed in FAMILY_TEAM_ROUTING.items():
        for team in routed:
            if team in team_ids:
                links.append({"family":number,"team":team,
                              "state":"source-guided-bounded-operational-analogue"})
    for team in team_ids:
        links.append({"family":21,"team":team,
                      "state":"shared-equal-respect-source-preservation-and-owner-consent-overlay"})
    one_links=[x for x in links if x["family"]==21]
    if len(one_links)!=len(team_ids):
        raise ValueError("Every team must receive the Family 21 ONE overlay")
    return {
        "schema":"nathan.one.federation.v074.family-overlay.v1",
        "family_slots":21,
        "source_defined_from_this_message":6,
        "unresolved_prior_family_definitions":15,
        "family21_name":"ONE",
        "family21_author_exact_declaration":author,
        "families_16_to_20_names":[x["name"] for x in records[15:20]],
        "family21_team_count":len(one_links),
        "all_creator_teams_receive_ONE":True,
        "links":links,
        "execution_limitations":"These source-defined roles operate through bounded file/audit tasks, not literal atom consciousness, omniscience, perpetual unbounded agents or inaccessible physics sensors.",
        "original_source_untouched":True
    }

def overlay_markdown(report: dict) -> str:
    lines=[
        "# FAMILY 21 — ONE · NATHAN AI v074",
        "",
        "## Author's complete stated principle",
        "",
        "> "+report["family21_author_exact_declaration"],
        "",
        "## Creator Teams",
        "",
        f"**{report['family21_team_count']} of {report['family21_team_count']} teams** inherit Family 21's shared equality, inclusion, consent and source-preservation operating rules.",
        "",
        "Source-supplied Omega titles:",
        "",
    ]
    for i,name in enumerate(report["families_16_to_20_names"],16):
        lines.append(f"- Family {i}: {name}")
    lines += [
        "- Family 21: ONE",
        "",
        "**Families 1–15** are recorded as unresolved identity slots. No names, missions or capabilities are invented.",
        "",
        "**Interpretive boundary:** The user's statements about animals, atoms and unity are preserved as authored principles. This code does not establish literal consciousness of atoms or equivalence of every natural phenomenon to a running agent. Restrict dangerous or unauthorized actions by evidence and consent, not by denying any person's dignity.",
        ""
    ]
    return "\n".join(lines)

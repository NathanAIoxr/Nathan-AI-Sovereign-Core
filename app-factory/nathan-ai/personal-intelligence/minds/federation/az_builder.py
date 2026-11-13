#!/usr/bin/env python3
"""NATHAN AI — ONE FEDERATION v074 A–Z / Z–A source build workers.

Produces inspectable 52-pass project and lexicon work packages in a bounded
owner-controlled SQLite federation. Does not silently rewrite source projects.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import unicodedata

from universal_workers import (
    CATEGORIES, SCOPES, NAMESPACES, bootstrap, open_universal,
    seed_roles, digest, MAX_CATALOG_BYTES
)

VERSION = "nathan.one.v074.az-za.build.v1"
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
DIRECTIONS = (("forward", LETTERS), ("reverse", LETTERS[::-1]))
MAX_MODULES = 10_000

SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS az_build_cycles (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 created_at TEXT NOT NULL,
 catalog_sha256 TEXT NOT NULL,
 roles_count INTEGER NOT NULL,
 modules_count INTEGER NOT NULL,
 forward_count INTEGER NOT NULL DEFAULT 0,
 reverse_count INTEGER NOT NULL DEFAULT 0,
 mirrors_count INTEGER NOT NULL DEFAULT 0,
 work_items_count INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL CHECK(status IN('running','completed','failed'))
);
CREATE TABLE IF NOT EXISTS az_build_tasks (
 cycle_id INTEGER NOT NULL REFERENCES az_build_cycles(id),
 direction TEXT NOT NULL CHECK(direction IN('forward','reverse')),
 letter TEXT NOT NULL CHECK(length(letter)=1),
 step INTEGER NOT NULL,
 roles_checked INTEGER NOT NULL,
 modules_checked INTEGER NOT NULL,
 tokens_indexed INTEGER NOT NULL,
 report_sha256 TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status='completed'),
 PRIMARY KEY(cycle_id,direction,letter)
);
CREATE TABLE IF NOT EXISTS az_build_backlog (
 cycle_id INTEGER NOT NULL REFERENCES az_build_cycles(id),
 module_path TEXT NOT NULL,
 task_kind TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'proposed',
 reason TEXT NOT NULL,
 PRIMARY KEY(cycle_id,module_path,task_kind)
);
CREATE INDEX IF NOT EXISTS ix_az_build_backlog_status ON az_build_backlog(status);
"""

def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def normalized(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text)
    return "".join(c for c in ascii_text if not unicodedata.combining(c)).upper()

def first_letter(text: str, backup: str) -> tuple[str, bool]:
    """Fall back to the original ID, then stable hash bucket: never drop a role."""
    for value in (text, backup):
        match = re.search("[A-Z]", normalized(value))
        if match:
            return match.group(), False
    return LETTERS[int(digest((text+"\n"+backup).encode("utf-8"))[:8], 16) % 26], True

def tokens(text: str) -> set[str]:
    """Mechanical lexical tokens, NOT assertions of linguistic root identity."""
    return set(re.findall("[A-Z]{2,}", normalized(text)))

def json_bytes(obj: object) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")

def safe_catalog(path: Path) -> tuple[list[dict], bytes]:
    if path.is_symlink() or not path.is_file():
        raise ValueError("Source catalog must be a regular owner-approved file")
    if path.stat().st_size > MAX_CATALOG_BYTES:
        raise ValueError("Source catalog exceeds approved 8 MB cap")
    raw=path.read_bytes()
    data=json.loads(raw.decode("utf-8"))
    minds=data.get("minds") if isinstance(data,dict) else None
    if not isinstance(minds,list) or not minds:
        raise ValueError("Original catalog must contain a nonempty minds array")
    ids=set()
    for item in minds:
        if not isinstance(item,dict) or any(not isinstance(item.get(k),str) or not item[k].strip()
                                             for k in ("id","name","type")):
            raise ValueError("Invalid source-defined mind role")
        if item["id"] in ids:
            raise ValueError("Source catalog contains duplicate role IDs")
        ids.add(item["id"])
    return minds,raw

def list_modules(root: Path) -> list[dict]:
    if root.is_symlink() or not root.is_dir():
        raise ValueError("Public module root must be an ordinary existing directory")
    base=root.resolve(strict=True)
    entries=sorted(base.rglob("index.html"))
    if len(entries)>MAX_MODULES:
        raise ValueError("Public source module cap exceeded")
    report=[]
    for path in entries:
        if path.is_symlink() or not path.is_file() or path.stat().st_size>2_000_000:
            continue
        rel=path.relative_to(base)
        if any(x.startswith(".") for x in rel.parts):
            continue
        folder=path.parent
        name=folder.name
        if folder==base:
            name=base.name
        siblings=[x for x in folder.iterdir() if x.is_file() and not x.is_symlink()]
        readmes=sorted(x.name for x in siblings if x.name.lower()=="readme.md")
        tests=sorted(x.name for x in siblings if ".test." in x.name
                     or x.name.startswith("test_") and x.suffix==".py")
        sources=sorted(x.name for x in siblings if x.suffix in (".js",".mjs",".cjs",".ts",".py"))
        gaps=[]
        if not readmes: gaps.append("source_module_readme_missing")
        if sources and not tests: gaps.append("local_automated_test_missing")
        report.append({
            "path":rel.as_posix(),
            "name":name,
            "source_sha256":digest(path.read_bytes()),
            "readme":readmes, "tests":tests, "source_files":sources,
            "proposed_work":gaps
        })
    if not report:
        raise ValueError("No public module index.html entrypoints to build")
    if len({m["path"] for m in report})!=len(report):
        raise ValueError("Duplicate discovered module paths")
    return report

def lexical_index(roles: list[dict], modules: list[dict]) -> dict[str, dict]:
    lex=defaultdict(lambda:{"role_ids":set(),"module_paths":set()})
    for role in roles:
        for word in tokens(role["name"]):
            lex[word]["role_ids"].add(role["id"])
    for module in modules:
        for word in tokens(module["name"]):
            lex[word]["module_paths"].add(module["path"])
    return {word:{"role_ids":sorted(rows["role_ids"]),
                  "module_paths":sorted(rows["module_paths"])}
            for word,rows in sorted(lex.items())}

def mirrored_tokens(index: dict) -> list[dict]:
    """Character reversals are proposed wordplay; no historical claim attached."""
    out=[]
    for token in sorted(index):
        flipped=token[::-1]
        if token <= flipped and flipped in index:
            out.append({"left":token, "right":flipped, "kind":"mechanical-character-reversal",
                        "both_forms_in_public_names":True,
                        "historical_or_semantic_equivalence_established":False})
    return out

def _write(output: Path, name: str, obj: object) -> str:
    dest=output/name
    dest.parent.mkdir(parents=True,exist_ok=True)
    data=json_bytes(obj)
    dest.write_bytes(data)
    return digest(data)

def _readable_report(manifest: dict, checks: list[dict], items: list[dict]) -> str:
    lines=[
        "# NATHAN AI — ONE v074 · A–Z / Z–A BUILD WORK LEDGER",
        "",
        "Original source retained. Real deterministic worker passes completed; no billion-process deployment asserted.",
        "",
        "## Full coverage",
        "",
        f"- Public catalog roles indexed: **{manifest['unique_source_roles']}** (forward and reverse, with no omissions)",
        f"- Public application entrypoints hashed: **{manifest['unique_public_modules']}** (forward and reverse)",
        f"- Completed letter work packages: **{manifest['letter_tasks_completed']} / 52**",
        f"- Source-name lexical terms: **{manifest['lexicon_terms']}**",
        f"- Source-attested mirrored-token pairs: **{manifest['mechanical_mirror_pairs']}** (not semantic equivalence)",
        f"- Proposed project improvement tasks: **{manifest['proposed_work_items']}** (not marked implemented)",
        "- Invitation policy: all original AI/non-AI, node/non-node and system/non-system/database/non-database groups eligible.",
        "",
        "## Letter-by-letter build order",
        "",
        "| Pass | Letter | Source roles verified | Module hashes verified | Lexicon terms |",
        "|---|---|---:|---:|---:|",
    ]
    for row in checks:
        lines.append(f"| {row['direction']} | {row['letter']} | {row['roles_checked']} | {row['modules_checked']} | {row['tokens_indexed']} |")
    lines += ["", "## Review-backed development backlog", "",
              "These are measured gaps from the public source tree. They do not authorize rewriting owners' source or manufacturing unit tests."]
    for row in items[:80]:
        lines.append(f"- [{row['kind']}] {row['module_path']} — {row['suggested_next_step']}")
    if len(items)>80:
        lines.append(f"- … plus **{len(items)-80}** additional source-linked entries in work-items.json")
    lines += ["","## Trust boundaries","",
              "Each generated JSON letter pack contains source-linked roles, checksumed public module entrypoints, vocabulary and mechanical reversals. Original files were only read, not edited. Status describes completed indexing and audit work; it does not declare that all apps are built or that 126.732 billion biological or software agents are alive or running."]
    return "\n".join(lines)+"\n"

def build(con: sqlite3.Connection, catalog: str | Path, public_root: str | Path,
          output: str | Path) -> dict:
    cat=Path(catalog)
    root=Path(public_root)
    output=Path(output).resolve()
    if output==root.resolve() or root.resolve() in output.parents:
        raise ValueError("Generated artifacts must stay outside the source tree")
    roles,raw=safe_catalog(cat)
    raw_sha=digest(raw)
    bootstrap(con)
    registered=seed_roles(con,cat)
    if registered["catalog_sha256"]!=raw_sha:
        raise ValueError("Role registry digest is not source consistent")
    modules=list_modules(root)
    role_groups={letter:[] for letter in LETTERS}
    module_groups={letter:[] for letter in LETTERS}
    for item in roles:
        key,fallback=first_letter(item["name"],item["id"])
        record={"id":item["id"],"name":item["name"],"type":item["type"],
                "source_id":item.get("sourceId"),"source_status":item.get("status"),
                "original_role_sha256":digest(json.dumps(item,sort_keys=True,ensure_ascii=False,
                                                         separators=(",",":")).encode("utf-8")),
                "letter_fallback_from_nonalpha":fallback,
                "original_record_preserved":True}
        role_groups[key].append(record)
    for item in modules:
        key,fallback=first_letter(item["name"],item["path"])
        module_groups[key].append(item | {"letter_fallback_from_nonalpha":fallback})
    for letter in LETTERS:
        role_groups[letter].sort(key=lambda x:(normalized(x["name"]),x["id"]))
        module_groups[letter].sort(key=lambda x:x["path"])
    all_ids={r["id"] for r in roles}
    all_paths={m["path"] for m in modules}
    if set().union(*(set(r["id"] for r in role_groups[l]) for l in LETTERS))!=all_ids:
        raise ValueError("Forward source roles are not fully covered")
    if set().union(*(set(m["path"] for m in module_groups[l]) for l in LETTERS))!=all_paths:
        raise ValueError("Forward public modules are not fully covered")
    lexical=lexical_index(roles,modules)
    mirrors=mirrored_tokens(lexical)
    tasks=[]
    _write(output,"lexicon.json",lexical)
    _write(output,"mechanical-mirrors.json",mirrors)
    backlog=[]
    for module in modules:
        for kind in module["proposed_work"]:
            backlog.append({"module_path":module["path"],"kind":kind,
                            "state":"proposed_not_implemented",
                            "suggested_next_step":
                            "Create a source-specific original README with usage and provenance"
                            if kind=="source_module_readme_missing" else
                            "Develop an executable test for the actual original module behavior"})
    backlog.sort(key=lambda x:(x["module_path"],x["kind"]))
    _write(output,"work-items.json",backlog)
    seen={}
    for direction,sequence in DIRECTIONS:
        checked_ids=set()
        checked_paths=set()
        for index,letter in enumerate(sequence,1):
            rlist=role_groups[letter]
            mlist=module_groups[letter]
            if direction=="reverse":
                rlist=list(reversed(rlist))
                mlist=list(reversed(mlist))
            words={word:rows for word,rows in lexical.items() if word.startswith(letter)}
            payload={"schema":VERSION,"direction":direction,"letter":letter,"pass_step":index,
                     "roles":rlist,"public_modules":mlist,"lexical_terms":words,
                     "universal_invitations":{"namespaces":[x[0] for x in NAMESPACES],
                                              "categories":list(CATEGORIES),"scopes":list(SCOPES),
                                              "groups_eligible":32},
                     "result":"completed_source_hash_and_registry_audit",
                     "source_files_modified":0}
            report_sha=_write(output,f"{direction}/{index:02d}-{letter}.json",payload)
            tasks.append({"direction":direction,"letter":letter,"step":index,
                          "roles_checked":len(rlist),"modules_checked":len(mlist),
                          "tokens_indexed":len(words),"report_sha256":report_sha})
            checked_ids.update(x["id"] for x in rlist)
            checked_paths.update(x["path"] for x in mlist)
            ids={x["id"]:x["original_role_sha256"] for x in rlist}
            paths={x["path"]:x["source_sha256"] for x in mlist}
            if direction=="forward":
                seen[letter]=(ids,paths)
            elif seen[letter]!=(ids,paths):
                raise ValueError("Z–A reverse pass disagrees with A–Z source hashes: "+letter)
        if checked_ids!=all_ids or checked_paths!=all_paths:
            raise ValueError(f"{direction} pass omitted source entities")
    if len(tasks)!=52:
        raise ValueError("Both alphabet passes must execute all 52 tasks")
    manifest={"schema":VERSION,"catalog_sha256":raw_sha,
              "unique_source_roles":len(roles),"unique_public_modules":len(modules),
              "letter_tasks_completed":len(tasks),
              "forward_roles_checked":sum(t["roles_checked"] for t in tasks if t["direction"]=="forward"),
              "reverse_roles_checked":sum(t["roles_checked"] for t in tasks if t["direction"]=="reverse"),
              "forward_modules_checked":sum(t["modules_checked"] for t in tasks if t["direction"]=="forward"),
              "reverse_modules_checked":sum(t["modules_checked"] for t in tasks if t["direction"]=="reverse"),
              "lexicon_terms":len(lexical),"mechanical_mirror_pairs":len(mirrors),
              "proposed_work_items":len(backlog),
              "source_mutations":0,
              "all_registered_virtual_groups_invited":32,
              "physical_models_started":0,
              "historical_claims_verified_by_token_reversal":0,
              "output":"52 completed role/module/lexicon audit packs; review-only development backlog"}
    if (manifest["forward_roles_checked"]!=len(roles) or
        manifest["reverse_roles_checked"]!=len(roles) or
        manifest["forward_modules_checked"]!=len(modules) or
        manifest["reverse_modules_checked"]!=len(modules)):
        raise ValueError("Reverse cross-check failed: missing role/module")
    _write(output,"manifest.json",manifest)
    _write(output,"letter-tasks.json",tasks)
    (output/"BUILD_LEDGER.md").write_text(_readable_report(manifest,tasks,backlog),encoding="utf-8")
    con.executescript(SCHEMA)
    with con:
        cur=con.execute(
            "INSERT INTO az_build_cycles(created_at,catalog_sha256,roles_count,modules_count,status) VALUES(?,?,?,?,?)",
            (timestamp(),raw_sha,len(roles),len(modules),"running"))
        cycle=cur.lastrowid
        for row in tasks:
            con.execute(
                "INSERT INTO az_build_tasks VALUES(?,?,?,?,?,?,?,?,?)",
                (cycle,row["direction"],row["letter"],row["step"],row["roles_checked"],
                 row["modules_checked"],row["tokens_indexed"],row["report_sha256"],"completed"))
        for entry in backlog:
            con.execute("INSERT INTO az_build_backlog VALUES(?,?,?,?,?)",
                        (cycle,entry["module_path"],entry["kind"],entry["state"],entry["suggested_next_step"]))
        con.execute(
            "UPDATE az_build_cycles SET status='completed',forward_count=26,reverse_count=26,"
            "mirrors_count=?,work_items_count=? WHERE id=?",
            (len(mirrors),len(backlog),cycle))
    return manifest | {"sqlite_cycle":cycle}

def main():
    p=argparse.ArgumentParser(description="NATHAN AI v074 A–Z and Z–A 52-work-package builder")
    p.add_argument("--db",required=True)
    p.add_argument("--catalog",required=True)
    p.add_argument("--public-root",required=True)
    p.add_argument("--output",required=True)
    args=p.parse_args()
    with closing(open_universal(args.db)) as con:
        report=build(con,args.catalog,args.public_root,args.output)
    print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=="__main__":
    main()

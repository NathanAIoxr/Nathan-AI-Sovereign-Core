#!/usr/bin/env python3
"""NATHAN AI · ONE DATABASE FEDERATION v074 · Creator Teams.

Ten bounded, source-preserving *software workstreams*. They build usable report
artifacts and a real website inventory, write a separately labeled editorial
working edition, inspect source and code, verify project changes, and prepare
reversible restoration proposals. Never pretend roles are running model agents.
"""
from __future__ import annotations

import argparse
import ast
import difflib
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import shlex
import subprocess
from urllib.parse import urlsplit, unquote

from az_builder import normalized
from universal_workers import digest, open_universal, utc

VERSION = "nathan.one.v074.creator-teams.v1"
MAX_SITE_PAGES = 300
MAX_PYTHON_CHECKS = 400
MAX_JS_CHECKS = 50
MAX_TASKS = 350
TEAM_DDL = """
CREATE TABLE IF NOT EXISTS creator_team_runs(
 id INTEGER PRIMARY KEY, created_at TEXT NOT NULL, version TEXT NOT NULL,
 role_count INTEGER NOT NULL, sites_seen INTEGER NOT NULL,
 locks_monitored INTEGER NOT NULL, changed_files INTEGER NOT NULL,
 drift_count INTEGER NOT NULL, work_items INTEGER NOT NULL, status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS creator_team_roles(
 cycle_id INTEGER NOT NULL REFERENCES creator_team_runs(id),
 role_id TEXT NOT NULL, team_id TEXT NOT NULL,
 source_role_sha256 TEXT NOT NULL, PRIMARY KEY(cycle_id,role_id)
);
CREATE TABLE IF NOT EXISTS creator_team_work(
 cycle_id INTEGER NOT NULL REFERENCES creator_team_runs(id),
 task_id TEXT NOT NULL, team_id TEXT NOT NULL,
 source_path TEXT NOT NULL, type TEXT NOT NULL, priority INTEGER NOT NULL,
 status TEXT NOT NULL, description TEXT NOT NULL,
 PRIMARY KEY(cycle_id,task_id)
);
CREATE TABLE IF NOT EXISTS creator_team_changes(
 cycle_id INTEGER NOT NULL REFERENCES creator_team_runs(id),
 source_path TEXT NOT NULL, status TEXT NOT NULL,
 locked_original INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(cycle_id,source_path,status)
);
"""

def cmd(root: Path, *parts: str, check=True) -> subprocess.CompletedProcess:
    return subprocess.run(parts, cwd=root, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, timeout=45, check=check)

def safe_relative(value: str) -> str:
    if not isinstance(value,str) or not value or "\\" in value or "\0" in value:
        raise ValueError("Invalid relative path")
    path=PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "." in path.parts:
        raise ValueError("Path must stay under the public repository")
    return path.as_posix()

def root_path(root: Path, value: str) -> Path:
    safe_relative(value)
    out=root/value
    if out.is_symlink():
        raise ValueError("Tracked symlink source not accepted: "+value)
    return out

def _git_blob(root: Path, path: str) -> str | None:
    file=root_path(root,path)
    if not file.is_file():
        return None
    result=cmd(root,"git","hash-object","--",path,check=False)
    if result.returncode:
        raise ValueError("Git hash-object failed for "+path)
    return result.stdout.decode().strip()

def changed_paths(root: Path, base: str) -> list[dict]:
    """Tracks committed changes across the requested exact Git ref, no renames."""
    if not re.fullmatch(r"[A-Za-z0-9._~^/-]{1,100}",base) or base.startswith("-"):
        raise ValueError("Unsupported Git comparison ref")
    c=cmd(root,"git","diff","--no-renames","--name-status","-z",
          base,"HEAD","--",check=False)
    if c.returncode:
        raise ValueError("Cannot compare requested git base to HEAD")
    parts=c.stdout.decode("utf-8").split("\0")
    parts=[x for x in parts if x]
    if len(parts)%2: raise ValueError("Malformed git diff output")
    result=[]
    for i in range(0,len(parts),2):
        status,rel=parts[i:i+2]
        rel=safe_relative(rel)
        result.append({"path":rel,"status":status,
                       "family":_family(rel),"type":"tracked_repo_change"})
    return result

def _family(path: str) -> str:
    if path.endswith((".md",".txt",".pdf")) and ("original-works" in path or "source-packs" in path):
        return "books"
    if path.startswith("app-factory/sites/") or path.endswith(".html"):
        return "websites"
    if path.startswith(".github/") or path.endswith((".py",".js",".mjs",".cjs",".ts")):
        return "code"
    if path.endswith(".json") or "database" in path:
        return "database"
    return "watch"

def protect_sources(root: Path, config: dict) -> list[dict]:
    report=[]
    for item in config["source_locks"]:
        rel=safe_relative(item["path"])
        expected=item["pinned_git_blob"]
        if not re.fullmatch("[0-9a-f]{40}",expected):
            raise ValueError("Pinned baseline is not a valid git blob digest")
        actual=_git_blob(root,rel)
        missing=actual is None
        if actual==expected:
            status="original_verified"
        elif missing:
            status="source_missing"
        else:
            status="changed_against_pinned_original"
        report.append({"path":rel,"expected_git_blob":expected,
                       "current_git_blob":actual,"status":status,
                       "reason":item["reason"],
                       "automatic_main_branch_revert":False})
    return report

def restore_plan(locked: list[dict]) -> str:
    lines=["# NATHAN AI · Protected-source restoration proposals","",
           "Original author texts are never silently overwritten. Review current and pinned Git blobs first.",
           "Automated workflows may prepare a **draft restoration pull request** for these exact source paths; merge remains owner-controlled.",""]
    for row in locked:
        if row["status"]=="original_verified": continue
        rel=row["path"];blob=row["expected_git_blob"]
        lines += [f"## {rel}",f"- Change: {row['status']}",
                  f"- Source-pinned Git blob: {blob}",
                  f"- Current Git blob: {row['current_git_blob'] or 'missing'}",
                  "- Approved restore command, on a fresh REVIEW BRANCH only:",
                  f"  git cat-file blob {blob} > {shlex.quote(rel)}",
                  "- Verify source, diff and author approval before merging.",
                  ""]
    if all(x["status"]=="original_verified" for x in locked):
        lines += ["All pinned originals match their source Git blob IDs."]
    return "\n".join(lines)+"\n"

def apply_restoration_on_review_branch(root: Path, config: dict) -> list[str]:
    """Generate a review-branch restoration patch; not called in normal audits."""
    branch=cmd(root,"git","branch","--show-current").stdout.decode().strip()
    if not branch.startswith("bot/creator-source-restore-v074-"):
        raise ValueError("Protected source restoration requires a dedicated bot review branch")
    changed=[]
    for item in protect_sources(root,config):
        if item["status"]=="original_verified":continue
        rel=item["path"];p=root_path(root,rel)
        blob=cmd(root,"git","cat-file","blob",item["expected_git_blob"])
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_bytes(blob.stdout)
        if _git_blob(root,rel)!=item["expected_git_blob"]:
            raise ValueError("Restored original failed Git blob verification")
        changed.append(rel)
    return changed

class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__();self.title="";self.h1=[];self.hrefs=[]
        self.has_lang=False;self._title=False;self._h1=False;self.img_missing_alt=0
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="html" and d.get("lang"):self.has_lang=True
        if tag=="title":self._title=True
        if tag=="h1":self._h1=True
        if tag in ("a","link","script","img"):
            link=d.get("href") or d.get("src")
            if link:self.hrefs.append(link)
        if tag=="img" and not d.get("alt",None) and d.get("alt",None)!="":
            self.img_missing_alt+=1
    def handle_endtag(self,tag):
        if tag=="title":self._title=False
        if tag=="h1":self._h1=False
    def handle_data(self,data):
        if self._title:self.title+=data
        if self._h1:self.h1.append(data)

def inspect_websites(root: Path, cfg: dict) -> list[dict]:
    site_root=root_path(root,cfg["public_sites_root"])
    if not site_root.is_dir():return []
    paths=sorted(site_root.rglob("index.html"))
    if len(paths)>MAX_SITE_PAGES:
        raise ValueError("Site inspection cap exceeded")
    sites=[]
    for file in paths:
        if file.is_symlink() or file.stat().st_size>2_000_000:continue
        parser=SiteParser()
        parser.feed(file.read_text(encoding="utf-8"))
        broken=[]
        for h in parser.hrefs:
            u=urlsplit(h)
            if u.scheme or u.netloc or h.startswith(("#","//","data:","mailto:","tel:")):
                continue
            candidate=unquote(u.path)
            if not candidate or candidate.startswith("/"):continue
            target=file.parent/candidate
            if target.is_dir():target=target/"index.html"
            if not target.exists():broken.append(h)
        rel=file.relative_to(root).as_posix()
        sites.append({"source_path":rel,"git_blob":_git_blob(root,rel),
                      "title":parser.title.strip(),"h1_count":len(parser.h1),
                      "has_lang":parser.has_lang,"image_alt_missing":parser.img_missing_alt,
                      "missing_local_targets":sorted(set(broken))[:25]})
    return sites

def site_index(sites: list[dict]) -> str:
    cards=[]
    for site in sites:
        rel=site["source_path"]
        title=escape(site["title"] or PurePosixPath(rel).parent.name)
        url="https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/"+rel
        flags=[]
        if not site["has_lang"]:flags.append("language tag review")
        if not site["h1_count"]:flags.append("heading review")
        if site["missing_local_targets"]:flags.append("link review")
        suffix="; ".join(flags) or "Source page indexed"
        cards.append('<article><h2>'+title+'</h2><a href="'+escape(url,quote=True)+'">Open existing website</a>'+
                     '<p>'+escape(suffix)+'</p><small>'+escape(rel)+'</small></article>')
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI · Website Factory Draft Inventory</title><style>body{font:16px/1.5 system-ui;margin:0;color:#f5f8fa;background:#101d29}main{max-width:1100px;margin:auto;padding:25px}a{color:#9ce8d6}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}article{background:#1b3442;padding:18px;border:1px solid #588091;border-radius:12px}h1{font-size:clamp(24px,4vw,48px)}small{overflow-wrap:anywhere}</style></head><body><main><h1>NATHAN AI · Website Factory</h1><p>Created source-based website inventory. Existing websites are linked, never silently replaced. Proposed fixes need review.</p><div class="cards">'+''.join(cards)+'</div></main></body></html>'

def book_working_edition(root: Path,cfg: dict) -> tuple[str,dict]:
    rel=safe_relative(cfg["selected_book_source"])
    file=root_path(root,rel)
    raw=file.read_bytes()
    source=raw.decode("utf-8")
    headings=[x.strip() for x in source.splitlines() if re.match(r"^#{1,5} +",x)]
    title="THE REBELLION"
    intro=[
        "# THE REBELLION — EDITORIAL WORKING EDITION",
        "",
        "**Author originals below belong to Nathan Tabor.** This is an independently generated publishing companion, not a replacement of source words.",
        "",
        "## Editorial structure under review",
        "",
        "Proposed publishing description (assistant-generated, separate from the author’s exact words):",
        "",
        "> A source-first record of THE REBELLION, built around the demand to protect innocence, examine institutions, and distinguish the choices people make from the words used to justify them.",
        "",
        "Existing source headings, reproduced without editorial correction:",
        ""
    ]
    intro += ["- "+h for h in headings] if headings else ["- No Markdown headings found in the original"]
    intro += [
        "",
        "## Publishing-team tasks (not completed manuscripts)",
        "",
        "- Organize existing exact quotations into source-cited chapters without rewriting original speech.",
        "- Keep author-direct words separate from spelling-corrected reading editions and outside commentary.",
        "- Fact-check historical claims and mark unresolved verification separately.",
        "- Prepare back-cover copy and a rights/edition manifest for owner approval.",
        "",
        f"**Exact source path:** {rel}",
        f"**Original SHA-256:** {digest(raw)}",
        "",
        "## VERBATIM SOURCE — original bytes transcribed as UTF-8",
        "",
        "~~~text",
        source,
        "~~~",
        ""
    ]
    return "\n".join(intro),{"source_path":rel,"original_sha256":digest(raw),"headings":headings,"bytes":len(raw)}

def inspect_code(root: Path,cfg: dict) -> list[dict]:
    base=root_path(root,"app-factory/nathan-ai")
    paths=sorted(base.rglob("*.py"))
    out=[]
    for path in paths[:MAX_PYTHON_CHECKS]:
        if path.is_symlink() or "recovered-source" in path.parts:continue
        rel=path.relative_to(root).as_posix()
        try:ast.parse(path.read_text(encoding="utf-8"));valid=True;err=""
        except (SyntaxError,UnicodeError) as e:valid=False;err=str(e)[:180]
        out.append({"source_path":rel,"check":"python_ast_parse",
                    "syntax_valid":valid,"error":err,"source_sha256":digest(path.read_bytes())})
    return out

def roles_to_teams(root: Path,cfg: dict) -> tuple[list[dict],dict]:
    cat=root_path(root,cfg["catalog"])
    raw=cat.read_bytes()
    data=json.loads(raw.decode("utf-8"))
    roles=data.get("minds")
    if not isinstance(roles,list):
        raise ValueError("Mind source catalog missing")
    teams=cfg["teams"]
    seen=set();out=[]
    for role in roles:
        rid=role.get("id")
        if not isinstance(rid,str) or not rid or rid in seen:
            raise ValueError("Duplicate or invalid source role")
        seen.add(rid)
        searchable=normalized(" ".join(str(role.get(k,"")) for k in ("name","purpose","type","group","id")))
        scores=[sum(1 for word in team["keywords"] if normalized(word) in searchable) for team in teams]
        top=max(scores)
        if top:
            selected=teams[scores.index(top)]
        else:
            selected=teams[int(digest(rid.encode("utf-8"))[:12],16)%len(teams)]
        out.append({"source_role_id":rid,"source_role_name":role.get("name",rid),
                    "source_type":role.get("type","unknown"),"assigned_team":selected["id"],
                    "assignment":"keyword" if top else "deterministic_unassigned_role_distribution",
                    "source_record_sha256":digest(json.dumps(role,sort_keys=True,ensure_ascii=False,
                                                            separators=(",",":")).encode("utf-8"))})
    summary={t["id"]:sum(x["assigned_team"]==t["id"] for x in out) for t in teams}
    return out,{"roles_count":len(out),"role_catalog_sha256":digest(raw),
                "per_team_role_counts":summary}

def task(team: str, path: str, kind: str, description: str, priority=5) -> dict:
    serial=f"{team}\n{path}\n{kind}\n{description}".encode()
    return {"id":digest(serial)[:20],"team":team,"source_path":path,
            "kind":kind,"priority":priority,"status":"proposed_not_implemented",
            "description":description}

def publish_report(path: Path, obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    if isinstance(obj,str):path.write_text(obj,encoding="utf-8")
    else:path.write_text(json.dumps(obj,indent=2,ensure_ascii=False,sort_keys=True)+"\n",encoding="utf-8")

def run_teams(root: Path, config: Path, output: Path, git_base: str,
              database: Path | None=None) -> dict:
    root=root.resolve(strict=True)
    if not (root/".git").exists():
        raise ValueError("Team runner requires an actual Git checkout")
    if root in output.resolve().parents or output.resolve()==root:
        # keep generated working artifacts outside the tracked source checkout
        raise ValueError("Reports must be written outside the source checkout")
    cfg=json.loads(config.read_text(encoding="utf-8"))
    if cfg.get("schema")!=VERSION:raise ValueError("Unrecognized creator-team policy")
    ids=[x["id"] for x in cfg["teams"]]
    if len(ids)!=len(set(ids)) or len(ids)!=10:
        raise ValueError("Exactly ten distinct creator teams are required")
    roles,role_report=roles_to_teams(root,cfg)
    sites=inspect_websites(root,cfg)
    book,book_report=book_working_edition(root,cfg)
    code=inspect_code(root,cfg)
    changes=changed_paths(root,git_base)
    locks=protect_sources(root,cfg)
    drift=[x for x in locks if x["status"]!="original_verified"]
    work=[]
    for x in sites:
        if not x["title"]:work.append(task("websites",x["source_path"],"missing_html_title","Add source-approved, accessible document title",3))
        if not x["has_lang"]:work.append(task("websites",x["source_path"],"missing_language_attribute","Specify correct page language",3))
        if not x["h1_count"]:work.append(task("websites",x["source_path"],"missing_h1","Add clear semantic source-approved page heading",4))
        if x["image_alt_missing"]:work.append(task("websites",x["source_path"],"image_alt_review","Review image accessibility alternatives",4))
        if x["missing_local_targets"]:work.append(task("websites",x["source_path"],"broken_relative_links",
            "Inspect local links: "+", ".join(x["missing_local_targets"][:8]),2))
    for x in code:
        if not x["syntax_valid"]:work.append(task("code",x["source_path"],"python_syntax_issue",x["error"],1))
    for x in drift:
        work.append(task("watch",x["path"],"protected_original_drift",
                         "Prepare exact owner-reviewed source restoration from "+x["expected_git_blob"],0))
    work.append(task("books",book_report["source_path"],"editorial_working_edition",
                     "Review generated source-verbatim working edition for chapter and publishing decisions",5))
    work.append(task("education",cfg["selected_course_source"],"course_build",
                     "Organize existing author method into a source-cited course, assignments and workbook",6))
    work.append(task("marketing",cfg["public_sites_root"],"publishing_inventory",
                     "Review website inventory and prepare source-backed release messaging",6))
    work.append(task("research",cfg["selected_course_source"],"evidence_research",
                     "Verify all claims requiring external documentation; never assert unverified etymologies",6))
    work.append(task("database",cfg["catalog"],"registry_sha_review",
                     "Review original 763 source-defined roles and source digest in ONE master",5))
    work.append(task("quality",cfg["public_sites_root"],"qa_gates",
                     "Inspect source, website, code and original-preservation audit before release",5))
    for x in changes:
        work.append(task("watch",x["path"],"tracked_change_review",
                         f"Review observed {x['status']} tracked change; do not silently roll back authorized edits",6))
    work.sort(key=lambda x:(x["priority"],x["team"],x["source_path"]))
    if len(work)>MAX_TASKS:raise ValueError("Work queue requires a reviewed expanded capacity")
    output.mkdir(parents=True,exist_ok=True)
    publish_report(output/"teams.json",{"schema":VERSION,"teams":cfg["teams"],
                                        "assigned_roles":role_report})
    publish_report(output/"role-assignments.json",roles)
    publish_report(output/"website-audit.json",sites)
    publish_report(output/"website-inventory.html",site_index(sites))
    publish_report(output/"books"/"THE_REBELLION_WORKING_EDITION.md",book)
    publish_report(output/"books"/"source-provenance.json",book_report)
    publish_report(output/"code"/"python-syntax-audit.json",code)
    publish_report(output/"monitor"/"tracked-changes.json",changes)
    publish_report(output/"monitor"/"source-locks.json",locks)
    publish_report(output/"monitor"/"restore-proposals.md",restore_plan(locks))
    publish_report(output/"work-queue.json",work)
    report={
      "schema":VERSION,"status":"completed_local_team_artifact_build",
      "creator_teams":len(ids),"registered_roles_assigned":len(roles),
      "roles_excluded":0,"website_pages_checked":len(sites),
      "book_sources_preserved":1,"python_source_files_syntax_checked":len(code),
      "python_source_syntax_errors":sum(not x["syntax_valid"] for x in code),
      "tracked_committed_changes":len(changes),"protected_source_locks_checked":len(locks),
      "protected_original_drift_count":len(drift),"pending_proposed_work_items":len(work),
      "completed_products":["source-linked website inventory","verbatim book working edition",
                            "Python syntax audit","change monitor and restoration plan",
                            "ten-team role assignments and work queue"],
      "remaining_work_truth":"Proposed books, website fixes and coding tasks are NOT considered implemented",
      "continuous_infrastructure":"GitHub Actions scheduled auditing; persistent private worker server not connected",
      "changes_made_to_original_source":0
    }
    # Use an existing ONE master; retained only on the owner host / ephemeral runner.
    with open_universal(database or output/"ONE_CREATOR_TEAMS.sqlite3") as con:
        con.executescript(TEAM_DDL)
        with con:
            cur=con.execute(
                "INSERT INTO creator_team_runs(created_at,version,role_count,sites_seen,locks_monitored,changed_files,drift_count,work_items,status)"
                " VALUES(?,?,?,?,?,?,?,?,?)",
                (utc(),VERSION,len(roles),len(sites),len(locks),len(changes),len(drift),len(work),"completed"))
            cycle=cur.lastrowid
            con.executemany("INSERT INTO creator_team_roles VALUES(?,?,?,?)",
                [(cycle,r["source_role_id"],r["assigned_team"],r["source_record_sha256"]) for r in roles])
            con.executemany("INSERT INTO creator_team_work VALUES(?,?,?,?,?,?,?,?)",
                [(cycle,t["id"],t["team"],t["source_path"],t["kind"],t["priority"],t["status"],t["description"]) for t in work])
            con.executemany("INSERT INTO creator_team_changes VALUES(?,?,?,?)",
                [(cycle,c["path"],c["status"],int(any(z["path"]==c["path"] for z in drift))) for c in changes])
    publish_report(output/"summary.json",report)
    return report

def main():
    p=argparse.ArgumentParser(description="NATHAN AI v074 source-preserving Creator Teams")
    p.add_argument("--root",default=".")
    p.add_argument("--config",default="app-factory/nathan-ai/personal-intelligence/minds/federation/creator-teams.v074.json")
    p.add_argument("--output",default="")
    p.add_argument("--git-base",default="HEAD^")
    p.add_argument("--db",default="",help="Existing owner-controlled ONE Federation SQLite master")
    p.add_argument("--apply-review-restoration",action="store_true")
    args=p.parse_args()
    root=Path(args.root).resolve(strict=True)
    config=root/args.config
    cfg=json.loads(config.read_text(encoding="utf-8"))
    if args.apply_review_restoration:
        print(json.dumps({"restored_for_review":apply_restoration_on_review_branch(root,cfg)},indent=2))
        return
    if not args.output:raise ValueError("--output is required for a scan")
    print(json.dumps(run_teams(root,config,Path(args.output).resolve(),args.git_base,
                               Path(args.db) if args.db else None),
                     indent=2,ensure_ascii=False))

if __name__=="__main__":
    main()

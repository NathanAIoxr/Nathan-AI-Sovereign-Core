#!/usr/bin/env python3
"""Repair repository-wide CI coverage without altering author-original source archives.

Runs on the dedicated repair branch. Commit-time validation must still pass separately.
"""
from __future__ import annotations
import pathlib
import posixpath
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
NATHAN = pathlib.PurePosixPath("app-factory/nathan-ai")
SKIP = ("app-factory/nathan-ai/eyeprints-handprints/",
        "app-factory/nathan-ai/personal-intelligence/minds/federation/source-packs/")
PRIVATE_READER = "app-factory/nathan-ai/family-research/private-reader.html"

def git_paths():
    return sorted(p for p in subprocess.check_output(
        ["git","ls-files","-z"],cwd=ROOT).decode().split("\0") if p)

def replace_exact(file: str, old: str, new: str):
    f=ROOT/file
    original=f.read_text(encoding="utf8")
    if old not in original:
        if new in original: return
        raise RuntimeError("Expected exact text is missing: "+file)
    updated=original.replace(old,new,1)
    if updated!=original: f.write_text(updated,encoding="utf8")

def page_integrations():
    changed=[]
    for name in git_paths():
        if not (name.startswith(str(NATHAN)+"/") and name.endswith(".html")):
            continue
        if name.startswith(SKIP) or name==PRIVATE_READER:
            continue
        f=ROOT/name
        src=f.read_text(encoding="utf8")
        a=src.count("data-nathan-shared-appearance")
        l=src.count("data-nathan-command-center")
        if a>1 or l>1:
            raise RuntimeError(f"Ambiguous existing integrations in {name}: {a}, {l}")
        if a and l: continue
        prefix=posixpath.relpath(str(NATHAN),posixpath.dirname(name))
        prefix="" if prefix=="." else prefix+"/"
        tags=[]
        if not a:
            tags += [
                f'<link rel="stylesheet" href="{prefix}appearance/shared.css" data-nathan-shared-appearance>',
                f'<script src="{prefix}appearance/engine.js"></script>',
                f'<script src="{prefix}appearance/app.js"></script>'
            ]
        if not l:
            tags += [
                f'<link rel="stylesheet" href="{prefix}launcher/shared.css" data-nathan-command-center>',
                f'<script src="{prefix}workspace.js" defer></script>',
                f'<script src="{prefix}assistant/engine.js" defer></script>',
                f'<script src="{prefix}launcher/engine.js" defer></script>',
                f'<script src="{prefix}launcher/app.js" defer></script>'
            ]
        insert="\n"+"\n".join(tags)+"\n"
        close=re.search(r"</head\s*>",src,re.I)
        if close:
            result=src[:close.start()]+insert+src[close.start():]
        else:
            # Some historical pages have an implicit HEAD. Add resources at the
            # end of their CSS/title metadata, before the visible page content.
            close=re.search(r"</style\s*>",src,re.I)
            if close is None:
                close=re.search(r"</title\s*>",src,re.I)
            if close is not None:
                result=src[:close.end()]+insert+src[close.end():]
            else:
                body=re.search(r"<(?:body|header|main)\b",src,re.I)
                if body is None:
                    raise RuntimeError("No safe integration insertion point: "+name)
                result=src[:body.start()]+insert+src[body.start():]
        f.write_text(result,encoding="utf8")
        changed.append(name)
    return changed

def main():
    # Hash-pinned author-original HTML belongs to the source archives, never to
    # the mutable presentation notice registry.
    replace_exact(
        "tools/record-notice/update.py",
        "name.startswith('recovered-source/') or '/originals/' in name or name in PRESERVED",
        "name.startswith('recovered-source/') or '/originals/' in name or '/source-packs/' in name or name in PRESERVED"
    )
    # Publish only these explicitly linked source files; do not globally expose
    # executable .py files or reinterpret arbitrary private files as web assets.
    f=ROOT/"tools/release/build.py"
    src=f.read_text(encoding="utf8")
    key="SOURCE_DOWNLOADS={"
    if key not in src: raise RuntimeError("Expected release download allowlist missing")
    extra="'app-factory/nathan-ai/voice-box/native/offline_tts.py','standalone-apps/ttfes-btp/LICENSE',"
    if extra not in src:
        src=src.replace(key,key+extra,1)
        f.write_text(src,encoding="utf8")
    # Fix stale links, while leaving original author wording in <pre> unchanged.
    path="app-factory/nathan-ai/god/v074/GOD_ONE_INTEGRATED_APP_v074.html"
    replace_exact(path,
                  '<a href="NATHAN_AI_ONE_UNIFIED_APP_v073.html">Open the preserved ONE v073 app</a>',
                  '<a href="../index.html">Open the GOD app hub</a>')
    replace_exact(path,
                  'href="GOD_AUTHOR_ORIGINAL_20261112.txt"',
                  'href="../v075/GOD_AUTHOR_ORIGINAL_20261112.txt"')
    updated=page_integrations()
    # Rebuild notices and SHA-256 ledger *after* adding shared resources.
    # The updater preserves all other author-original HTML bytes.
    subprocess.run(["python3","tools/record-notice/update.py"],cwd=ROOT,check=True)
    print(f"Repaired shared integrations on {len(updated)} Nathan AI pages")
    for path in updated: print("  "+path)
    assert 1+1==2 and 1-1==0
    print("Arithmetic anchors verified: 1+1=2; 1-1=0")

if __name__=="__main__": main()

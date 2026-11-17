"""Build the public catalog from the repository and the existing ONE registry."""

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
from urllib.parse import quote, urlparse


DIRECTORY = Path(__file__).resolve().parent
REPO = DIRECTORY.parents[1]
REPOSITORY = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core"
PAGES = "https://nathanaiOxr.github.io/Nathan-AI-Sovereign-Core"
CLOUD = "nathantaboract.workers.dev"
SCOPES = ("app-factory/", "standalone-apps/")
EXCLUDED = {"node_modules", "private", "private-samples", "archive", "originals", "recovered-source"}
WORKERS = (
    ("bibletopia", "Bible Topia", "Study", "Read and search the Bible Topia catalog."),
    ("tabor-world", "Tabor World", "Worlds", "Explore the original worlds and their connected works."),
    ("grapple-it", "Grapple It", "Games", "Play the touch-based hook and grappling arcade."),
    ("hook-and-ring", "Hook and Ring", "Games", "Swing and land rings in the browser."),
    ("tabor-tracker-ball", "Tabor Track Baller", "Games", "Explore the gesture-driven trackball."),
    ("tabor-universal-library-engine", "Universal Library Engine", "Study", "Open the gesture-driven library and its interactive labs."),
    ("nathan-tabor-labs", "Nathan Tabor Labs", "Tools", "Open the public lab workbench."),
    ("nathan-tabor-library", "Library of Tabor", "Study", "Browse the public book and series catalog."),
    ("dual-screen-arcade", "Dual-Screen Arcade", "Games", "Pair the upper and lower play areas."),
    ("one-sovereign-hub", "ONE Sovereign Hub", "Tools", "Open the existing ONE control center."),
    ("nathan-absolute-intelligence", "Nathan AI", "Tools", "Open Nathan AI Absolute Intelligence."),
    ("pee-dee-valley", "Pee Dee Valley", "Worlds", "Explore the public Pee Dee Valley project."),
)


class PageMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title = []
        self.interactive = False
        self.script = False
        self.viewport = False

    def handle_starttag(self, tag, attrs):
        fields = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "script" and fields.get("type") not in {"application/json", "application/ld+json", "importmap"}:
            self.script = True
        if tag in {"button", "input", "canvas", "select", "form", "textarea", "summary"} or any(
            key.startswith(("onclick", "oninput", "onchange")) for key in fields
        ):
            self.interactive = True
        if tag == "meta" and fields.get("name", "").lower() == "viewport":
            self.viewport = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)


def kind(path):
    for label, keys in (
        ("Games", ("arcade", "game", "chess", "puzzle", "grapple", "ring", "sudoku", "boxing", "darts", "sport")),
        ("Study", ("bible", "library", "book", "scriptur", "concordance", "language", "atlas", "learn", "read", "history")),
        ("Worlds", ("world", "tabor-tales", "kingdom", "cosmic", "understone", "peede", "pee-dee")),
    ):
        if any(key in path for key in keys):
            return label
    return "Tools"


def permitted(path):
    return path.startswith(SCOPES) and not (set(Path(path).parts) & EXCLUDED) and not path.startswith("app-factory/portfolio/")


def launch_ok(url):
    parsed = urlparse(url)
    return parsed.scheme == "https" and parsed.hostname in {
        "nathanaiOxr.github.io".lower(),
        *(f"{worker}.{CLOUD}" for worker, *_ in WORKERS),
    } and not parsed.username and not parsed.password and not parsed.port


def build():
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip()
    names = subprocess.check_output(["git", "ls-tree", "-r", "--name-only", "-z", commit], cwd=REPO).decode().split("\0")
    registered = json.loads((REPO / "app-factory/sovereign-hub/cloudflare/public/apps.json").read_text())
    source_rows = {r["entry"]: r for r in registered["apps"] if permitted(r["entry"])}
    records = [
        {"id": worker, "title": title, "kind": category, "state": "hosted", "url": f"https://{worker}.{CLOUD}/",
         "description": description}
        for worker, title, category, description in WORKERS
    ]
    for name in names:
        if not permitted(name) or not name.endswith((".html", ".htm", ".html.in")):
            continue
        source = source_rows.get(name)
        meta = PageMetadata()
        meta.feed((REPO / name).read_text(errors="replace"))
        if not (source or (meta.script and meta.interactive)):
            continue
        encoded = quote(name, safe="/")
        url = source["url"] if source and launch_ok(source["url"]) else f"{PAGES}/{encoded}"
        if name.endswith(".in"):
            url = None
        records.append({
            "id": "app-" + hashlib.sha256(name.encode()).hexdigest()[:16],
            "title": (source or {}).get("title") or " ".join("".join(meta.title).split())[:180] or Path(name).stem,
            "kind": kind(name.lower()), "state": "template" if url is None else "registered",
            "url": url, "path": name, "viewport": meta.viewport,
        })
    records[len(WORKERS):] = sorted(records[len(WORKERS):], key=lambda x: (x["title"].casefold(), x["path"]))
    return {"schema": 1, "commit": commit, "repository": REPOSITORY, "items": records}


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--output", type=Path, default=DIRECTORY / "catalog.json")
    args = cli.parse_args()
    catalog = build()
    args.output.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f'{len(catalog["items"])} public entries')

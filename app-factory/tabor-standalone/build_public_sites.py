"""Bundle the public portfolio's tracked entry pages and their local dependencies."""
from collections import deque
from html.parser import HTMLParser
import base64
import gzip
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import subprocess
from urllib.parse import unquote, urlsplit

PROJECT = Path(__file__).resolve().parent
REPO = PROJECT.parents[1]
OUT = PROJECT / ".release" / "public-sites"
ROOTS = {"app-factory", "standalone-apps", "docs", "publications", "publishing", "branding", "landing"}
EXCLUDED = {"private", "private-samples", "archive", "originals", "recovered-source", "node_modules", "secrets", "backups"}
TYPES = {
    ".html": "text/html", ".htm": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
    ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json",
    ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".woff": "font/woff",
    ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav",
    ".wasm": "application/wasm", ".txt": "text/plain", ".md": "text/plain", ".csv": "text/csv",
}
TEMPLATES = {"index": "/", "chassis": "/chassis", "grapple": "/grapple-it", "competition": "/competition",
             "arcade": "/arcade", "training": "/training", "yard-darts": "/yard-darts"}
HOOK = "https://hook-and-ring.nathantaboract.workers.dev"
SITE = "https://tabor-public-sites.nathantaboract.workers.dev"
RELEASE = "2026-11-17.5"
LOCAL_LITERAL = re.compile(r"""['"`]((?:\.?\.?/)?[\w@/%.-]+\.(?:m?js|json|css|html|svg|png|webp|wasm|csv|webmanifest|md|woff2?)(?:[?#][^'"\s]*)?)['"`]""", re.I)
CSS_URL = re.compile(r"""url\(\s*['"]?([^'")\s]+)""", re.I)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.files = []

    def handle_starttag(self, tag, attrs):
        fields = dict(attrs)
        for key in ("src", "poster", "href", "data-src", "data-entry"):
            value = fields.get(key)
            if value and (tag != "a" or value.startswith((".", "/"))):
                self.files.append(value)


def refs(path, content):
    suffix = PurePosixPath(path).suffix
    text = content.decode(errors="replace")
    if suffix in {".html", ".htm"}:
        parser = Links()
        parser.feed(text)
        return parser.files + LOCAL_LITERAL.findall(text) + CSS_URL.findall(text)
    if suffix == ".css":
        return CSS_URL.findall(text)
    if suffix in {".mjs", ".js", ".webmanifest"}:
        return LOCAL_LITERAL.findall(text)
    return []


def local_path(current, value):
    try:
        url = urlsplit(value)
    except ValueError:
        return None
    if url.scheme or url.netloc or not url.path:
        return None
    decoded = unquote(url.path)
    if decoded.startswith("/Nathan-AI-Sovereign-Core/"):
        return decoded.removeprefix("/Nathan-AI-Sovereign-Core/")
    path = posixpath.normpath(decoded.lstrip("/") if decoded.startswith("/") else
                              posixpath.join(posixpath.dirname(current), decoded))
    return path + ("/" if decoded.endswith("/") else "")


def permitted(path):
    parts = PurePosixPath(path).parts
    return bool(parts and parts[0] in ROOTS and not set(parts) & EXCLUDED
                and not any(p.startswith(".") for p in parts)
                and PurePosixPath(path).suffix in TYPES)


def main():
    tracked = set(subprocess.check_output(["git", "-C", str(REPO), "ls-files", "-z"]).decode().split("\0"))
    revision = subprocess.check_output(["git", "-C", str(REPO), "rev-parse", "HEAD"], text=True).strip()
    portfolio = json.loads((REPO / "app-factory/portfolio/catalog.json").read_text())
    plugins = json.loads((REPO / "standalone-apps/hook-and-ring/game/game-plugins.json").read_text())
    launch = {}
    queue = deque()
    for item in portfolio["items"]:
        path = item.get("path", "")
        if item["state"] == "registered" and permitted(path) and path in tracked:
            launch[item["id"]] = {"path": path}
            queue.append(path)
        elif item["state"] == "template":
            slug = PurePosixPath(path).name.removesuffix(".html.in")
            launch[item["id"]] = {"url": HOOK + TEMPLATES[slug]}
    files = {}
    blocked = []
    while queue:
        path = queue.popleft()
        if path in files or path in blocked:
            continue
        file = REPO / path
        if not file.is_file() or file.is_symlink() or file.stat().st_size > 2_000_000:
            blocked.append(path)
            continue
        raw = file.read_bytes()
        files[path] = raw
        for value in refs(path, raw):
            ref = local_path(path, value)
            if not ref:
                continue
            ref = ref.rstrip("/")
            for candidate in (ref, ref + "/index.html"):
                if candidate in tracked and permitted(candidate):
                    queue.append(candidate)
                    break
    launch = {id: entry for id, entry in launch.items() if "url" in entry or entry["path"] in files}
    board_rows = [{"id": row["id"], "title": row["name"], "chassis": row["baseChassis"]} for row in plugins]
    if len(launch) != 386 or len({row["id"] for row in board_rows}) != 60:
        raise ValueError(f"Unexpected release coverage: {len(launch)} site entries and {len(board_rows)} boards")
    OUT.mkdir(parents=True, exist_ok=True)
    index = {}
    batch = {}
    chunks = []
    for path, raw in sorted(files.items()):
        content = base64.b64encode(gzip.compress(raw, compresslevel=9, mtime=0)).decode()
        slots = []
        for offset in range(0, len(content), 78_000):
            segment = content[offset:offset + 78_000]
            if sum(len(v) for v in batch.values()) + len(segment) > 90_000:
                chunks.append(batch)
                batch = {}
            slot = f"{len(chunks):04d}.{len(batch)}"
            slots.append(slot)
            batch[slot] = segment
        index[path] = slots
    if batch:
        chunks.append(batch)
    for i, data in enumerate(chunks):
        (OUT / f"pack-{i:04d}.json").write_text(json.dumps(data, separators=(",", ":")))
    linked_assets = [path for path in blocked if PurePosixPath(path).suffix == ".png"]
    meta = {"release": RELEASE, "commit": revision, "assets": index, "launch": launch, "boards": board_rows,
            "linkedAssets": linked_assets,
            "counts": {"publishedPages": sum("path" in x for x in launch.values()),
                       "liveTemplateLinks": sum("url" in x for x in launch.values()),
                       "arcadeBoards": len(board_rows), "sourceFiles": len(files), "assetPacks": len(chunks),
                       "linkedFullResolutionImages": len(linked_assets)}}
    runtime = (PROJECT / "public-sites-worker.mjs").read_text()
    (OUT / "worker.mjs").write_text("const build=" + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";\n" + runtime)
    (OUT / "receipt.json").write_text(json.dumps({"release": RELEASE, "commit": revision, "counts": meta["counts"],
        "oversizeOrMissing": blocked}, indent=2) + "\n")
    print(json.dumps(meta["counts"]))


if __name__ == "__main__":
    main()

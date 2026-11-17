"""Package the portfolio's static assets into one self-contained Cloudflare Worker."""

import argparse
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess


HERE = Path(__file__).resolve().parent
FILES = {
    "index.html": "text/html; charset=utf-8",
    "style.css": "text/css; charset=utf-8",
    "app.mjs": "application/javascript; charset=utf-8",
    "assets/tabor-world.webp": "image/webp",
    "catalog.json": "application/json; charset=utf-8",
    "progress.json": "application/json; charset=utf-8",
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--source")
    args = parser.parse_args()
    source = args.source or subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=HERE, text=True).strip()
    if not re.fullmatch("[0-9a-f]{40}", source):
        parser.error("--source requires a 40-character Git commit")
    assets = {}
    for filename, mime in FILES.items():
        data = (HERE / filename).read_bytes()
        assets["/" + filename] = {
            "type": mime,
            "etag": '"' + hashlib.sha256(data).hexdigest() + '"',
            "gzip": base64.b64encode(gzip.compress(data, mtime=0)).decode("ascii"),
        }
    manifest = json.dumps(assets, separators=(",", ":"))
    worker = (HERE / "worker.mjs").read_text()
    args.output.write_text(worker + "\nexport default createWorker(new Map(Object.entries(" + manifest + ")), " + json.dumps(source) + ");\n")
    print(f'{len(assets)} files packed in {args.output.stat().st_size} bytes')


if __name__ == "__main__":
    main()

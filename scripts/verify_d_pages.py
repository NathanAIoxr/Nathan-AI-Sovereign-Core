#!/usr/bin/env python3
"""Check Nathan AI D archive local publication inputs or deployed GitHub Pages.

This checks public HTML and source metadata only. It does not access private
Libraries, use credentials, or mutate website content.
"""
import argparse
import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

CHECKS = {
    "main": ("app-factory/nathan-ai/index.html", "D · Original Words"),
    "gateway": ("app-factory/nathan-ai/d-archive/index.html", "Interactive D source explorer"),
    "archive": ("archive-index/alphabet/d/index.html", "D — The Complete Work Finding Aid"),
    "canon": ("archive-index/alphabet/d/canonical-d-sequences.json", None),
    "chatbox": ("app-factory/nathan-ai/hop-in/chatbox/index.html", "Explore D / DD / DDD / inversions"),
    "directory": ("app-factory/nathan-ai/websites/index.html", "D · Original Words & Variations"),
    "desktop": ("app-factory/nathan-ai/websites/registry.js", '"id": "nathan-ai/d-archive/index.html"'),
}
ORIGINAL_TITLES = (
    "the Demonology Dilution of Atoms",
    "The Double Dilution of Amplitudes",
    "The David Dilution of Ancestry-kin",
    "Dancing Demons",
    "Davidic Dancers",
)


def remote_read(base, relative):
    url = urllib.parse.urljoin(base.rstrip("/") + "/", relative)
    request = urllib.request.Request(url, headers={"User-Agent": "NathanAI-Pages-SmokeTest/1.0"})
    last = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=12) as response:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status}: {url}")
                return response.read(3_000_000).decode("utf-8")
        except (OSError, UnicodeError, RuntimeError) as exc:
            last = exc
            if attempt < 4:
                time.sleep(3)
    raise RuntimeError(f"Live URL could not be verified: {url}: {last}")


def verify(root=None, url=None):
    originals = {}
    for key, (relative, needle) in CHECKS.items():
        if root is not None:
            source = root / relative
            content = source.read_text(encoding="utf-8")
        else:
            content = remote_read(url, relative)
        if needle and needle not in content:
            raise AssertionError(f"Missing expected public marker in {key}: {needle}")
        originals[key] = content
        print("PASS", key, relative)
    canon = json.loads(originals["canon"])
    titles = tuple(row["title"] for row in canon["categories"])
    if titles != ORIGINAL_TITLES:
        raise AssertionError("Five exact D original sequence titles changed")
    if 'src="../../../archive-index/alphabet/d/index.html"' not in originals["gateway"]:
        raise AssertionError("D gateway iframe lost original interactive archive")
    if 'href="../d-archive/index.html"' not in originals["directory"]:
        raise AssertionError("D website directory lost application gateway link")
    print("PASS original 5 D titles and source/navigation contracts")
    print("VERIFIED: 7 public files")


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--root", type=pathlib.Path)
    group.add_argument("--url", type=str)
    args = parser.parse_args()
    if args.url:
        parsed = urllib.parse.urlparse(args.url)
        if parsed.scheme != "https" or not parsed.hostname:
            parser.error("The deployment URL must be HTTPS with a hostname")
    try:
        verify(root=args.root.resolve() if args.root else None, url=args.url)
    except (AssertionError, OSError, UnicodeError, json.JSONDecodeError, ValueError) as exc:
        print("FAIL", exc, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

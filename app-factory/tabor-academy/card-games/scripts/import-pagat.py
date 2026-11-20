"""Extract source links and factual deck/name metadata from a saved Pagat index."""
from collections import defaultdict
from hashlib import sha256
from pathlib import Path
from unicodedata import normalize
from urllib.parse import urljoin, urlparse
import argparse
import json
import re
from lxml import html

BASE = "https://www.pagat.com/alpha/"
DOMINO_TILES = {"Chinese Dominoes", "Indonesian Dominoes", "Western dominoes", "Number tiles"}

FAMILIES = {}
for family, directories in {
    "Trick-taking": "aceten allfours auctionwhist boston exact jass karnoeffel kt5 last marriage preference put quads schafkopf spoil5 tarots trumps whist",
    "Melding": "rummy",
    "Shedding": "beating climbing eights stops",
    "Fishing": "fishing",
    "Exchange": "quartet commerce",
    "Comparison": "banking poker vying",
    "Adding": "adders",
    "Layout": "patience solitaire",
    "Capture": "war",
}.items():
    FAMILIES.update({directory: family for directory in directories.split()})


def clean(node):
    return " ".join(node.text_content().split())


def class_path(class_name):
    return f'contains(concat(" ",normalize-space(@class)," ")," {class_name} ")'


def key(title):
    return normalize("NFKC", title).casefold()


def load_catalog(source):
    tree = html.parse(source)
    records = {}
    pending_aliases = []
    for row in tree.xpath(f'//div[{class_path("alphatable")}]//tr[td[{class_path("col1")}]]'):
        cells = row.xpath("./td")
        if len(cells) != 4:
            continue
        decks = cells[2].xpath(".//span/@title")
        if set(decks) <= DOMINO_TILES:
            continue
        titles = cells[0].xpath(f'.//span[{class_path("lname")} or {class_path("aname")}]')
        direct = cells[0].xpath(f'.//span[{class_path("lname")}]/a[@href]')
        alias_targets = cells[0].xpath(f'.//span[{class_path("canonical")}]/a[@href]')
        links = direct or alias_targets
        if not titles or not links:
            continue
        url = urljoin(BASE, links[0].get("href"))
        if urlparse(url).netloc != "www.pagat.com" or not url.startswith("https://"):
            continue
        name = clean(titles[0])
        disambiguation = cells[0].xpath(f'.//span[{class_path("disamb")}]')
        qualified = " ".join([name, *map(clean, disambiguation)])
        if not direct:
            pending_aliases.append((name, qualified, clean(links[0]), url))
            continue
        identity = (key(qualified), url)
        label = re.sub(r"[^a-z0-9]+", "-", normalize("NFKD", qualified).lower()).strip("-")[:52]
        suffix = sha256(("\n".join(identity)).encode()).hexdigest()[:10]
        records[identity] = {
            "id": f"idx-{label or 'game'}-{suffix}", "title": qualified,
            "family": FAMILIES.get(urlparse(url).path.split("/")[1], "Unclassified"),
            "region": "", "players": clean(cells[1]),
            "deck": "; ".join([", ".join(deck for deck in decks if deck not in DOMINO_TILES), clean(cells[3])]).strip("; "),
            "status": "indexed", "aliases": [], "sources": [{"label": "Pagat game reference", "url": url}],
        }
    urls = defaultdict(list)
    for identity, record in records.items():
        urls[identity[1]].append(record)
    for short, qualified, target_name, url in pending_aliases:
        target = records.get((key(target_name), url))
        if target is None and len(urls[url]) == 1:
            target = urls[url][0]
        if target is not None and key(short) != key(target["title"]):
            if short not in target["aliases"]:
                target["aliases"].append(short)
        elif target is None:
            # Index canonicals that appear only as alias targets. Multiple named
            # sections of one source page may describe genuinely different games.
            identity = (key(target_name), url)
            if identity not in records:
                suffix = sha256(("\n".join(identity)).encode()).hexdigest()[:10]
                records[identity] = {
                    "id": f"idx-reference-{suffix}", "title": target_name,
                    "family": FAMILIES.get(urlparse(url).path.split("/")[1], "Unclassified"),
                    "region": "", "players": "", "deck": "", "status": "indexed", "aliases": [],
                    "sources": [{"label": "Pagat game reference", "url": url}],
                }
            if short != target_name and short not in records[identity]["aliases"]:
                records[identity]["aliases"].append(short)
    return sorted(records.values(), key=lambda row: (key(row["title"]), row["id"]))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("html", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    games = load_catalog(str(args.html))
    if len(games) < 500:
        raise SystemExit("Input did not contain the expected alphabetical index")
    args.output.write_text(json.dumps(games, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(games)} source-indexed records")

"""Extract public catalog titles and reference fields from three official snapshots."""
import csv
import hashlib
import json
import re
import sys
from html import unescape
from pathlib import Path
from urllib.parse import urljoin


def canada(file):
    page = file.read_text()
    links = re.findall(r'href="(/eng/trades/[^"]+\.shtml)" class="list-group-item"[^>]*>([^<]+)', page)
    return [(unescape(title.strip()), path.rsplit("/", 1)[1].removesuffix(".shtml"),
             "Red Seal designated trade", "", "", urljoin("https://red-seal.ca", path)) for path, title in links]


def germany(file):
    text = file.read_text()
    marker = "1.1 Alphabetische Liste der anerkannten oder als anerkannt geltenden Ausbildungsberufe"
    pages = text.split(marker, 1)[1].split("1.2 Systematisches Verzeichnis", 1)[0]
    rows = []
    for line in pages.splitlines():
        value = line.strip()
        hit = re.match(r"^(\d+)\.\s+(.+)$", value)
        if hit:
            rows.append([int(hit[1]), hit[2]])
        elif rows and len(value) > 1 and not value.startswith("–") and not re.search(r"\((?:IH|Hw|FB|Lw|öD|Hk|Se|ÖD|HwK)(?:, ?(?:IH|Hw|FB|Lw|öD|Hk|Se|ÖD|HwK))*\)$", rows[-1][1]):
            rows[-1][1] += " " + value
    if [x[0] for x in rows] != list(range(1, 325)):
        raise ValueError("The BIBB index is no longer the expected 324 numbered occupations")
    return [(title, "Section 1.1 · Item " + str(index), "Recognized training occupation", "2026 edition", "",
             "https://www.bibb.de/dienst/publikationen/en/21008") for index, title in rows]


def england(file):
    data = json.loads(file.read_text())
    rows = []
    for item in data:
        title = item["title"]
        reference = item["referenceNumber"] + " · " + item["versionNumber"]
        status = item["status"]
        if status == "Approved for delivery" and item["approvedForDeliveryPausedStarts"]:
            status += " · paused for starts"
        earliest = (item["earliestStartDate"] or "")[:10]
        latest = (item["latestStartDate"] or "")[:10]
        period = " · ".join(word for word in [("First start " + earliest) if earliest else "",
                   ("Last start " + latest) if latest else ""] if word)
        route = item["route"] or "Route unspecified"
        level = item["level"]
        extra = route + (". Level " + str(level) + "." if level else ".")
        url = item["standardPageUrl"] or "https://skillsengland.education.gov.uk/apprenticeships/"
        rows.append((title, reference, status, period, extra, url))
    # The public finder also publishes foundation and apprenticeship units outside the Standards API.
    html_path = file.with_suffix(".html")
    sections = re.split(r'data-standard="([^"]+)"', html_path.read_text())
    for i in range(1, len(sections), 2):
        item = json.loads(unescape(sections[i]))
        if not item["referenceNumber"].startswith(("FA", "AU")):
            continue
        body = sections[i + 1]
        href = re.search(r'<a href="([^"]+)"', body)[1]
        title = re.search(r'<h2[^>]*>\s*(.+?)\s*</h2>', body, re.S)[1]
        version = re.search(r'Version:\s*([\d.]+)', body)[1]
        state = {
            "ApprovedForDelivery": "Approved for delivery",
            "ApprovedForDelivery-Paused": "Approved for delivery · paused for starts",
            "Retired": "Retired",
            "InDevelopment": "In development",
            "Withdrawn": "Withdrawn",
        }.get(item["status"], item["status"])
        period = (item["approvedDate"] or "")[:10]
        routes = " / ".join(item["route"])
        detail = ("Foundation apprenticeship" if item["referenceNumber"].startswith("FA") else "Apprenticeship unit") + ". " + routes
        rows.append((unescape(title), item["referenceNumber"] + " · " + version, state, period, detail,
                     urljoin("https://skillsengland.education.gov.uk", href)))
    if len({r[1] for r in rows}) != len(rows):
        raise ValueError("Duplicate Skills England reference and version")
    return rows


def snapshot(folder):
    path = Path(folder)
    files = {"england": ("england.json", england), "canada": ("red-seal.html", canada), "germany": ("germany.txt", germany)}
    coverage = {}
    bundles = {}
    for key, (filename, read) in files.items():
        file = path / filename
        rows = read(file)
        if not rows or len(set(r[1] for r in rows)) != len(rows) or any(not r[0] for r in rows):
            raise ValueError("Incomplete or duplicate record in " + key)
        hash_file = path / "germany.pdf" if key == "germany" else file
        blob = hash_file.read_bytes()
        if key == "england":
            blob += file.with_suffix(".html").read_bytes()
        coverage[key] = {"records": len(rows), "sha256": hashlib.sha256(blob).hexdigest()}
        bundles[key] = rows
    return {"retrieved": "2026-11-20", "sources": coverage, "records": bundles}


if __name__ == "__main__":
    print(json.dumps(snapshot(sys.argv[1]), ensure_ascii=False, separators=(",", ":")))

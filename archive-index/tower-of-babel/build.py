"""Build the static reader and, optionally, its self-contained Cloudflare Worker."""
import argparse
from base64 import b64encode
import gzip
import hashlib
from html import escape
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent


def render(markdown):
    html = subprocess.run(
        ["pandoc", "-f", "gfm-raw_html", "-t", "html5", "--wrap=none"],
        input=markdown, text=True, capture_output=True, check=True,
    ).stdout
    return html.replace("<table>", '<div class="table-scroll" tabindex="0"><table>').replace(
        "</table>", "</table></div>"
    )


def evidence_sections(evidence):
    heading = re.compile(r"^### ([A-E])\. (.+)$", re.M)
    exhibit = re.compile(r"(?m)^\*\*([A-E]\d{2}) · .+$")
    groups = list(heading.finditer(evidence))
    exhibits = set()
    rendered_groups = []
    options = []
    general_notes = []
    for i, group in enumerate(groups):
        key, title = group.groups()
        end = groups[i + 1].start() if i + 1 < len(groups) else len(evidence)
        lines = []
        for paragraph in re.split(r"\n\n", evidence[group.end():end].strip()):
            match = exhibit.match(paragraph)
            if not match:
                general_notes.append(render(paragraph))
                continue
            exhibit_id = match[1]
            if exhibit_id in exhibits:
                raise ValueError(f"Duplicate exhibit {exhibit_id}")
            exhibits.add(exhibit_id)
            link = f'<a href="#{exhibit_id}" aria-label="Link to exhibit {exhibit_id}">#</a>'
            lines.append(
                f'<article class="exhibit" id="{exhibit_id}" data-exhibit="{key}">'
                f'{link}{render(paragraph)}</article>'
            )
        options.append(f'<option value="{key}">{escape(title)}</option>')
        rendered_groups.append(
            f'<section class="exhibit-group"><h3>{escape(title)}</h3>{"".join(lines)}</section>'
        )
    return (
        render(evidence[:groups[0].start()]) + "".join(general_notes),
        "".join(options), "".join(rendered_groups), len(exhibits),
    )


def static_page(manuscript, artwork_revision):
    parts = re.split(r"(?m)^## [1-4]\. [^\n]+\n", manuscript, maxsplit=4)
    if len(parts) != 5:
        raise ValueError("Expected four manuscript sections")
    _, original, editorial, evidence, attachment = parts
    preface, options, groups, exhibit_count = evidence_sections(evidence)
    editorial_html = render(editorial)
    contents = [
        f'<li><a href="#{escape(section)}">{label}</a></li>'
        for section, label in re.findall(r'<h3 id="([^"]+)">(.+?)</h3>', editorial_html)
    ]
    regions = {
        "HERO": f'<img class="mast-art" src="./tower.webp?v={artwork_revision}" alt="" width="1320" height="743" fetchpriority="high">',
        "SCRIPT": (ROOT / "reader.js").read_text().rstrip(),
        "CONTENTS": "".join(contents),
        "ORIGINAL": render(original), "EDITORIAL": editorial_html,
        "EVIDENCE_PREFACE": preface, "CATEGORIES": options,
        "EVIDENCE": groups, "ATTACHMENT": render(attachment),
        "EXHIBIT_COUNT": str(exhibit_count),
    }
    page = re.sub(r"%%([A-Z_]+)%%", lambda m: regions[m[1]], (ROOT / "reader.html.in").read_text())
    return page, exhibit_count


def worker_source(page, manuscript, metadata, artwork):
    def text_asset(text, mime_type):
        return [b64encode(gzip.compress(text.encode(), mtime=0)).decode(), mime_type, True]

    assets = {
        "/": text_asset(page, "text/html; charset=utf-8"),
        "/manuscript.md": text_asset(manuscript, "text/markdown; charset=utf-8"),
        "/release.json": text_asset(metadata, "application/json; charset=utf-8"),
        "/tower.webp": [b64encode(artwork).decode(), "image/webp", False],
    }
    return "const assets = " + json.dumps(assets, ensure_ascii=False) + r""";
export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const path = new URL(request.url).pathname;
    const entry = Object.hasOwn(assets, path === "/index.html" ? "/" : path)
      ? assets[path === "/index.html" ? "/" : path] : null;
    if (!entry) return new Response("Page not found", { status: 404 });
    const headers = {
      "Content-Type": entry[1],
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    };
    if (path === "/manuscript.md") {
      headers["Content-Disposition"] = 'attachment; filename="Tower_of_Babel_Restored_and_Expanded.md"';
    }
    let body = null;
    if (request.method === "GET") {
      const bytes = Uint8Array.from(atob(entry[0]), char => char.charCodeAt(0));
      body = entry[2] ? new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")) : bytes;
    }
    return new Response(body, { headers });
  },
};
"""


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("--worker", type=Path, help="Write the Cloudflare module to this path")
    options = args.parse_args()
    raw = (ROOT / "manuscript.md").read_bytes()
    manuscript = raw.decode()
    artwork = (ROOT / "tower.webp").read_bytes()
    artwork_sha256 = hashlib.sha256(artwork).hexdigest()
    page, exhibit_count = static_page(manuscript, artwork_sha256[:12])
    metadata = json.dumps({
        "title": "The Tower of Babel",
        "author": "Nathan Tabor",
        "edition": "expanded-reading-edition",
        "exhibits": exhibit_count,
        "artwork_sha256": artwork_sha256,
        "manuscript_sha256": hashlib.sha256(raw).hexdigest(),
    }, indent=2) + "\n"
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    (ROOT / "release.json").write_text(metadata)
    if options.worker:
        options.worker.write_text(worker_source(page, manuscript, metadata, artwork))


if __name__ == "__main__":
    main()

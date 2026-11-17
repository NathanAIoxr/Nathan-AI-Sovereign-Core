"""Build the static reader and, optionally, its self-contained Cloudflare Worker."""
import argparse
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
    for i, group in enumerate(groups):
        key, title = group.groups()
        end = groups[i + 1].start() if i + 1 < len(groups) else len(evidence)
        lines = []
        for paragraph in re.split(r"\n\n", evidence[group.end():end].strip()):
            match = exhibit.match(paragraph)
            if not match:
                lines.append(render(paragraph))
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
    if len(exhibits) != 26:
        raise ValueError(f"Expected all 26 exhibits, found {len(exhibits)}")
    return render(evidence[:groups[0].start()]), "".join(options), "".join(rendered_groups)


def static_page(manuscript):
    parts = re.split(r"(?m)^## [1-4]\. [^\n]+\n", manuscript, maxsplit=4)
    if len(parts) != 5:
        raise ValueError("Expected four manuscript sections")
    _, original, editorial, evidence, attachment = parts
    preface, options, groups = evidence_sections(evidence)
    regions = {
        "ORIGINAL": render(original), "EDITORIAL": render(editorial),
        "EVIDENCE_PREFACE": preface, "CATEGORIES": options,
        "EVIDENCE": groups, "ATTACHMENT": render(attachment),
    }
    return re.sub(r"%%([A-Z_]+)%%", lambda m: regions[m[1]], (ROOT / "reader.html").read_text())


def worker_source(page, manuscript, metadata):
    assets = {
        "/": [page, "text/html; charset=utf-8"],
        "/manuscript.md": [manuscript, "text/markdown; charset=utf-8"],
        "/release.json": [metadata, "application/json; charset=utf-8"],
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
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    };
    if (path === "/manuscript.md") {
      headers["Content-Disposition"] = 'attachment; filename="Tower_of_Babel_Restored_and_Expanded.md"';
    }
    return new Response(request.method === "HEAD" ? null : entry[0], { headers });
  },
};
"""


def main():
    import hashlib

    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("--worker", type=Path, help="Write the Cloudflare module to this path")
    options = args.parse_args()
    raw = (ROOT / "manuscript.md").read_bytes()
    manuscript = raw.decode()
    page = static_page(manuscript)
    metadata = json.dumps({
        "title": "The Tower of Babel",
        "author": "Nathan Tabor",
        "exhibits": 26,
        "manuscript_sha256": hashlib.sha256(raw).hexdigest(),
    }, indent=2) + "\n"
    (ROOT / "index.html").write_text(page)
    (ROOT / "release.json").write_text(metadata)
    if options.worker:
        options.worker.write_text(worker_source(page, manuscript, metadata))


if __name__ == "__main__":
    main()

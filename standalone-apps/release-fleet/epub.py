"""Package the existing sourced series map and chapter previews as EPUB 3."""

import json
from pathlib import Path
import subprocess
import sys
from xml.etree import ElementTree as XML
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile

CONTAINER = '''<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>'''


def xhtml(title, body):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head><title>{escape(title)}</title></head><body>{body}</body></html>'''


def build(book, commit_time, folder):
    title = book["title"]
    edition = book["edition"]
    contents = book["chapters"]
    links = []
    manifest = []
    spine = []
    chapters = {}
    for index, (name, body) in enumerate(contents, 1):
        filename = f"chapter-{index:02}.xhtml"
        key = f"chapter-{index:02}"
        links.append(f'<li><a href="{filename}">{escape(name)}</a></li>')
        manifest.append(f'<item id="{key}" href="{filename}" media-type="application/xhtml+xml"/>')
        spine.append(f'<itemref idref="{key}"/>')
        chapters[filename] = xhtml(name, f"<h1>{escape(name)}</h1><p>{escape(body)}</p>")
    navigation = xhtml(edition, f'<h1>{escape(title)}</h1><p>{escape(edition)}</p><nav epub:type="toc"><h2>Contents</h2><ol>{"".join(links)}</ol></nav>')
    package = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="pub-id">urn:nathan-ai:{book["id"]}</dc:identifier>
<dc:title>{escape(title)} · {escape(edition)}</dc:title><dc:language>en</dc:language>
<dc:creator>Nathan Tabor</dc:creator><meta property="dcterms:modified">{escape(commit_time)}</meta>
</metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>{"".join(manifest)}</manifest>
<spine><itemref idref="nav"/>{"".join(spine)}</spine></package>'''
    path = folder / (book["id"] + ".epub")
    with ZipFile(path, "w", ZIP_DEFLATED) as out:
        out.writestr("mimetype", "application/epub+zip", compress_type=ZIP_STORED)
        out.writestr("META-INF/container.xml", CONTAINER)
        out.writestr("EPUB/package.opf", package)
        out.writestr("EPUB/nav.xhtml", navigation)
        for name, content in chapters.items():
            out.writestr("EPUB/" + name, content)
    with ZipFile(path) as reader:
        if reader.testzip() or reader.infolist()[0].compress_type != ZIP_STORED:
            raise RuntimeError(f"Invalid EPUB container: {path}")
        for name in reader.namelist()[1:]:
            XML.fromstring(reader.read(name))
    print(f"{path.name}: {len(contents)} sourced entries")


if __name__ == "__main__":
    import datetime

    here = Path(__file__).resolve().parent
    destination = Path(sys.argv[1])
    destination.mkdir(parents=True, exist_ok=True)
    books = json.loads(subprocess.check_output(["node", str(here / "books.mjs")], text=True))
    commit_time = subprocess.check_output(["git", "show", "-s", "--format=%cI", "HEAD"], cwd=here, text=True).strip()
    utc = datetime.datetime.fromisoformat(commit_time).astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    for record in books:
        build(record, utc, destination)

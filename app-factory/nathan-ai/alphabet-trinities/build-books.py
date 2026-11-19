"""Build the two EPUB3 volumes from the generated reader."""
from html import escape
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile, ZipInfo
import re
import sys

BOOKS = Path(__file__).resolve().parent / "public" / "alphabet-books"
CONTAINER = """<?xml version="1.0"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>"""


def xhtml(title, content):
    return (f'<?xml version="1.0" encoding="UTF-8"?>'
            f'<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" '
            f'xml:lang="en"><head><title>{escape(title)}</title></head><body>{content}</body></html>')


def package(number, title, content, references, original):
    metadata = f"""<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book">urn:nathan-tabor:alphabet-trinities:volume-{number}</dc:identifier>
    <dc:title>{escape(title)}</dc:title><dc:creator>Nathan Tabor</dc:creator><dc:language>en</dc:language>
    <meta property="dcterms:modified">2026-11-19T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="chapter"/></spine>
</package>"""
    nav = xhtml("Contents", '<nav epub:type="toc"><h1>Contents</h1><ol>'
                '<li><a href="chapter.xhtml">Volume</a></li>'
                '<li><a href="chapter.xhtml#original">Source text</a></li>'
                '<li><a href="chapter.xhtml#references">References</a></li></ol></nav>')
    chapter = xhtml(title, content + f'<section id="original"><h2>Source text</h2><pre>{escape(original)}</pre></section>'
                    f'<section id="references"><h2>References</h2>{references}</section>')
    parts = {"META-INF/container.xml": CONTAINER, "EPUB/package.opf": metadata,
             "EPUB/nav.xhtml": nav, "EPUB/chapter.xhtml": chapter}
    for xml in parts.values():
        ElementTree.fromstring(xml)
    with ZipFile(BOOKS / f"volume-{number}.epub", "w") as archive:
        archive.writestr(ZipInfo("mimetype"), "application/epub+zip", compress_type=ZIP_STORED)
        for path, text in parts.items():
            archive.writestr(ZipInfo(path), text, compress_type=ZIP_DEFLATED)


def contents():
    reader = (BOOKS / "index.html").read_text(encoding="utf8")
    get_section = lambda name: re.search(r'<section class="block" id="' + name + r'">(.*?)</section>', reader, re.S)[1]
    refs = re.search(r'<h2>Sources</h2>(.*?)</section>', reader, re.S)[1]
    for number, anchor, title, source in (
        (1, "abc", "The A, B, and C Trinities", "abc-source.md"),
        (2, "tv", "The Trinity of T’s and the V Shift", "tv-source.txt"),
    ):
        chapter = re.sub(r'<ul class="no-print">.*?</ul>', "", get_section(anchor), flags=re.S)
        package(number, title, chapter, refs, (BOOKS / source).read_text(encoding="utf8"))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        raise SystemExit("Usage: python3 build-books.py")
    contents()

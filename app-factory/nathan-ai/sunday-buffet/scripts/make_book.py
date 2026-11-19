"""Generate the web reader and printable PDF from BOOK.md."""
from html import escape
from os import environ
from pathlib import Path
import re
from xml.sax.saxutils import escape as xml_escape

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
TITLE, *chapter_text = (ROOT / "BOOK.md").read_text().split("\n## ")
TITLE = TITLE.removeprefix("# ").strip()
CHAPTERS = []
for chapter in chapter_text:
    heading, body = chapter.split("\n\n", 1)
    slug = re.sub(r"[^a-z0-9]+", "-", heading.lower()).strip("-")
    CHAPTERS.append((heading, slug, body.strip().split("\n\n")))

LINK = re.compile(r"\[([^\]]+)\]\((https://[^\s)]+)\)")
SUBTITLE = "Two plates, one check, and the hands that clear the table."
BYLINE = "A satire based on Nathan Tabor’s Sunday buffet concept"


def paragraph_markup(paragraph, pdf=False):
    safe = xml_escape if pdf else escape
    pos = 0
    parts = []
    for match in LINK.finditer(paragraph):
        label, url = match.groups()
        parts.append(safe(paragraph[pos:match.start()]))
        if pdf:
            parts.append(f'<link href="{safe(url)}" color="#a53623"><u>{safe(label)}</u></link>')
        else:
            parts.append(f'<a href="{safe(url)}">{safe(label)}</a>')
        pos = match.end()
    parts.append(safe(paragraph[pos:]))
    return "".join(parts)


def write_html():
    contents = "\n".join(f'<li><a href="#{slug}">{escape(heading)}</a></li>' for heading, slug, _ in CHAPTERS)
    sections = []
    for heading, slug, body in CHAPTERS:
        paragraphs = "\n".join(f"<p>{paragraph_markup(p)}</p>" for p in body)
        sections.append(f'<section class="chapter" id="{slug}"><h2>{escape(heading)}</h2>\n{paragraphs}</section>')
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#222b23"><meta name="description" content="{escape(SUBTITLE)}">
<title>{TITLE} · The Book</title>
<link rel="stylesheet" href="./style.css"><link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon-192.png"><link rel="apple-touch-icon" href="./icon-192.png">
<script type="module" src="./app.mjs"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="wrap nav"><a class="brand" href="./"><span class="mark" aria-hidden="true">NT</span>Nathan Tabor</a><nav aria-label="Main"><a href="./game">Game</a><a href="./app">App</a><a href="./book" aria-current="page">Book</a></nav></div></header>
<main class="wrap subpage book" id="main">
<header class="page-head"><p class="eyebrow">THE BOOK · FIRST EDITION</p><h1>{TITLE}.</h1><p>{escape(SUBTITLE)} {escape(BYLINE)}.</p><a class="button ghost" href="./book.pdf" download="Sunday-Buffet-Slam-Down.pdf">Download the PDF</a></header>
<nav class="contents" aria-label="Chapters"><h2>Contents</h2><ol>{contents}</ol></nav>
{"".join(sections)}
</main>
<footer class="foot"><div class="wrap"><span>{TITLE}</span><span>Yes is Yes · No is No · 1 + 1 = 2</span></div></footer>
</body>
</html>
'''
    (PUBLIC / "book.html").write_text(html)


def write_pdf():
    font_dir = Path(environ.get("LIBERATION_FONT_DIR", "/usr/share/fonts/truetype/liberation"))
    for font in ("LiberationSerif-Regular", "LiberationSerif-Bold", "LiberationSerif-BoldItalic",
                 "LiberationSans-Regular", "LiberationMono-Regular", "LiberationMono-Bold"):
        pdfmetrics.registerFont(TTFont(font, str(font_dir / f"{font}.ttf")))
    width, height = 432, 648
    margin = 44
    text_width = width - margin * 2
    paper = HexColor("#f8f2e5")
    ink = HexColor("#222b23")
    red = HexColor("#a53623")
    gold = HexColor("#efc579")
    line = HexColor("#d4cab6")
    pdf = canvas.Canvas(str(PUBLIC / "book.pdf"), pagesize=(width, height), pageCompression=1, invariant=1)
    pdf.setTitle(TITLE)
    pdf.setAuthor("Based on Nathan Tabor’s Sunday buffet concept")
    body_style = ParagraphStyle("body", fontName="LiberationSerif-Regular", fontSize=12.1, leading=17.4, textColor=ink, alignment=TA_LEFT)
    heading_style = ParagraphStyle("heading", fontName="LiberationSerif-Bold", fontSize=32, leading=34, textColor=ink)
    pdf.bookmarkPage("cover")
    pdf.addOutlineEntry("Cover", "cover")
    pdf.setFillColor(ink)
    pdf.rect(0, 0, width, height, stroke=0, fill=1)
    pdf.setFillColor(gold)
    pdf.setFont("LiberationMono-Bold", 9)
    pdf.drawString(margin, 586, "11:55 AM AMEN  /  12:10 PM RANCH")
    pdf.setFillColor(paper)
    pdf.setFont("LiberationSerif-Bold", 52)
    pdf.drawString(margin - 2, 513, "Sunday Buffet")
    pdf.setFont("LiberationSerif-BoldItalic", 59)
    pdf.setFillColor(gold)
    pdf.drawString(margin - 2, 454, "Slam-Down.")
    pdf.setFillColor(paper)
    pdf.setFont("LiberationSerif-Regular", 15)
    pdf.drawString(margin, 415, SUBTITLE)
    for x, y, radius, fill in [(260, 228, 105, "#c88356"), (175, 195, 109, "#edc98b")]:
        pdf.setFillColor(HexColor(fill))
        pdf.circle(x, y, radius, stroke=0, fill=1)
        pdf.setStrokeColor(paper)
        for inset in (13, 17, 29):
            pdf.circle(x, y, radius - inset, stroke=1, fill=0)
    pdf.saveState()
    pdf.translate(141, 151)
    pdf.rotate(8)
    pdf.setFillColor(paper)
    pdf.roundRect(0, 0, 143, 102, 3, stroke=0, fill=1)
    pdf.setFillColor(red)
    pdf.setFont("LiberationMono-Bold", 18)
    pdf.drawString(13, 74, "TABLE 15")
    pdf.setFillColor(ink)
    pdf.setFont("LiberationMono-Bold", 9)
    for y, label, amount in [(55, "SUBTOTAL", "$48.20"), (40, "TIP", "$9.64"), (19, "TOTAL", "$57.84")]:
        pdf.drawString(13, y, label)
        pdf.drawRightString(130, y, amount)
    pdf.restoreState()
    pdf.setFillColor(paper)
    pdf.setFont("LiberationSans-Regular", 9)
    pdf.drawString(margin, 48, BYLINE.replace("’", "'"))
    pdf.showPage()

    for page, (heading, slug, body) in enumerate(CHAPTERS, 1):
        pdf.bookmarkPage(slug)
        pdf.addOutlineEntry(heading, slug)
        pdf.setFillColor(paper)
        pdf.rect(0, 0, width, height, stroke=0, fill=1)
        pdf.setFillColor(red)
        pdf.setFont("LiberationMono-Bold", 9)
        pdf.drawString(margin, 594, "SUNDAY BUFFET SLAM-DOWN")
        pdf.setStrokeColor(line)
        pdf.line(margin, 578, width - margin, 578)
        headline = Paragraph(xml_escape(heading), heading_style)
        _, headline_height = headline.wrap(text_width, height)
        y = 555 - headline_height
        headline.drawOn(pdf, margin, y)
        y -= 19
        for text in body:
            paragraph = Paragraph(paragraph_markup(text, pdf=True), body_style)
            _, block_height = paragraph.wrap(text_width, height)
            y -= block_height
            if y < 58:
                raise ValueError(f"Page {page} overflows below the text area at {y:.1f}")
            paragraph.drawOn(pdf, margin, y)
            y -= 11
        pdf.line(margin, 43, width - margin, 43)
        pdf.setFillColor(ink)
        pdf.setFont("LiberationMono-Regular", 9)
        pdf.drawString(margin, 27, "TABLE 15")
        pdf.drawRightString(width - margin, 27, str(page))
        pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    write_html()
    write_pdf()

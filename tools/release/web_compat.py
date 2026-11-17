#!/usr/bin/env python3
"""Check public page metadata and exercise small-screen browser entry points."""

import argparse
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import subprocess
from threading import Thread

ROOT = Path(__file__).resolve().parents[2]
TRACKER = "app-factory/tabor-tracker-ball/public/"
ARCADE = "app-factory/games/dual-screen-arcade/"
TOWER = "archive-index/tower-of-babel/"
ENGINE = "app-factory/tabor-universal-library-engine/public/"
SERIES = "publications/pee-dee-valley/"
EDITIONS = "publishing/pee-dee-valley/"
ROUTES = (
    "", "app-factory/", "standalone-apps/", "app-factory/nathan-ai/",
    "app-factory/sovereign-hub/cloudflare/public/apps.html",
    ARCADE, TRACKER, ENGINE, ENGINE + "world/", "app-factory/grapple-it/public/",
    "app-factory/modern-day-bible/", TOWER, SERIES, EDITIONS,
    EDITIONS + "children.html", EDITIONS + "teen.html", EDITIONS + "sources.html",
    *(SERIES + f"book-{number:02}.html" for number in range(1, 14)),
)


class Metadata(HTMLParser):
    language = ""
    is_page = False

    def __init__(self):
        super().__init__()
        self.viewports = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.is_page = True
            self.language = attrs.get("lang") or ""
        if tag == "meta" and (attrs.get("name") or "").lower() == "viewport":
            self.viewports.append(re.sub(r"\s+", "", (attrs.get("content") or "").lower()))


def check_metadata():
    files = subprocess.check_output(
        ["git", "-C", str(ROOT), "ls-files", "-z", "*.html", "*.html.in"],
    ).decode().strip("\0").split("\0")
    checked, errors = 0, []
    for path in filter(None, files):
        if path.startswith("recovered-source/") or path == "landing/original-chat-landing.html":
            continue
        page = Metadata()
        page.feed((ROOT / path).read_text())
        if not page.is_page:
            continue
        checked += 1
        if not page.language:
            errors.append(f"{path}: document language is missing")
        if len(page.viewports) != 1 or "width=device-width" not in page.viewports[0]:
            errors.append(f"{path}: expected one responsive viewport")
        elif re.search(r"(?:^|,)(?:user-scalable=(no|0)|maximum-scale=(1(?:\.0+)?|0(?:\.\d+)?))(?:,|$)", page.viewports[0]):
            errors.append(f"{path}: browser zoom is restricted")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"Checked viewport and language metadata on {checked} active page sources.")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def check_page(browser, url, width, height, touch):
    context = browser.new_context(
        viewport={"width": width, "height": height}, has_touch=touch, is_mobile=touch,
        reduced_motion="reduce",
    )
    try:
        failures = []
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(url) else route.abort())
        for path in ROUTES:
            response = page.goto(url + path, wait_until="load")
            assert response and response.ok, (path, response and response.status)
            assert page.title(), path
            size = page.evaluate("({reported:innerWidth, actual:document.documentElement.scrollWidth})")
            if size["reported"] != width or size["actual"] > width + 1:
                overflow = page.evaluate("""width => [...document.querySelectorAll('body *')]
                    .filter(el => el.getBoundingClientRect().right > width + 2 && getComputedStyle(el).position !== 'fixed')
                    .slice(0, 8).map(el => el.id || el.className?.baseVal || el.className || el.tagName)""", width)
                failures.append((path, width, height, size, overflow))
        assert not failures, failures
        assert not errors, (width, height, errors)
        page.goto(url + TOWER)
        toc = page.locator("details.chapter-contents")
        assert toc.evaluate("(el) => el.open") == (width > 800)
        if width <= 800:
            toc.locator("summary").click()
            toc.get_by_role("link", name="The full reading", exact=True).click()
            assert page.url.endswith("#the-full-reading") and not toc.evaluate("(el) => el.open")
        page.goto(url + TRACKER)
        game = page.locator("#field")
        game.focus()
        game.press("Space")
        page.wait_for_function("!document.getElementById('replay').disabled")
        game.press("r")
        page.locator("#trace-label").wait_for(state="visible")
        game.press("Escape")
        page.locator("#trace-label").wait_for(state="hidden")
        page.goto(url + ARCADE)
        page.locator("#confirm").click()
        page.locator("#stage").press("Space")
        assert page.locator("#stage").evaluate("(el) => el.clientWidth > 100 && el.clientHeight > 100")
        if width >= 620 and height <= 550:
            assert page.locator(".bridge").evaluate("(el) => getComputedStyle(el).gridRowStart") == "2"
        assert not errors, (width, height, errors)
        print(f"{width}×{height}: {len(ROUTES)} web routes plus reader and game controls.")
    finally:
        context.close()


def check_browser():
    from playwright.sync_api import sync_playwright

    handler = partial(QuietHandler, directory=ROOT)
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            url = f"http://127.0.0.1:{server.server_port}/"
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch()
                try:
                    for width, height, touch in ((320, 700, True), (390, 844, True), (844, 390, True), (1440, 900, False)):
                        check_page(browser, url, width, height, touch)
                finally:
                    browser.close()
        finally:
            server.shutdown()
            thread.join()


if __name__ == "__main__":
    options = argparse.ArgumentParser(description=__doc__)
    options.add_argument("--browser", action="store_true")
    args = options.parse_args()
    check_metadata()
    if args.browser:
        check_browser()

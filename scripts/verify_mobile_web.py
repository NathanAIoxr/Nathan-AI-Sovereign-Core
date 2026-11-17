#!/usr/bin/env python3
"""Exercise the public catalog, games and readers on a static subpath host."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
from threading import Thread

from playwright.sync_api import expect, sync_playwright

PREFIX = "/tabor-preview"
HUB = "/app-factory/sovereign-hub/cloudflare/public"
GRAPPLE = "/app-factory/grapple-it/public/"
ENGINE = "/app-factory/tabor-universal-library-engine/public/"
BOOKS = "/publications/pee-dee-valley/"
STANDALONE = "/standalone-apps/app-factory/one/library/"
STUDIO = "/app-factory/one/design-studio/"
WIDTHS = [(320, 660), (390, 844), (667, 375), (768, 1024), (1280, 800)]


class PreviewHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        return super().translate_path(path[len(PREFIX):])

    def do_GET(self):
        if not self.path.startswith(PREFIX + "/"):
            self.send_error(404)
            return
        super().do_GET()

    def log_message(self, *args):
        pass


def layout(page, width):
    viewport, scroll = page.evaluate(
        "() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]"
    )
    assert viewport == width and scroll <= width + 1, (page.url, width, viewport, scroll)


def visit(page, base, path, width):
    response = page.goto(base + path, wait_until="load")
    assert response.ok, (path, response.status)
    layout(page, width)


def verify(browser, base, catalog_count):
    for width, height in WIDTHS:
        context = browser.new_context(
            viewport={"width": width, "height": height},
            is_mobile=width < 768,
            has_touch=width < 1280,
            reduced_motion="reduce",
            service_workers="block",
        )
        context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base + "/") else route.abort())
        with context.new_page() as page:
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            visit(page, base, HUB + "/apps.html", width)
            expect(page.locator("#count")).to_have_text(f"{catalog_count} of {catalog_count} app entry points")
            page.get_by_role("searchbox").fill("Grapple")
            expect(page.get_by_role("link", name=re.compile("^Open Grapple It"))).to_be_visible()
            layout(page, width)

            visit(page, base, GRAPPLE, width)
            jet = page.get_by_role("button", name="Air left")
            if width < 1280:
                assert jet.bounding_box()["height"] >= 44
                jet.tap()
            else:
                jet.focus()
                page.keyboard.press("Enter")
            expect(page.locator("#toy-jets")).to_have_text(re.compile(r"^[1-9]\d*$"))
            page.get_by_role("button", name="Bubble Courses").click()
            expect(page.locator("#grapple-scene")).to_be_visible()
            layout(page, width)

            visit(page, base, ENGINE, width)
            expect(page.locator("#entries .entry").first).to_be_attached()
            for value in range(1, 5):
                page.locator("#sequence").get_by_role("button", name=str(value), exact=True).click()
            expect(page.locator("#status")).to_contain_text("Sequence complete")
            layout(page, width)

            visit(page, base, ENGINE + "world/", width)
            expect(page.locator("#status")).to_contain_text("832 records")
            page.get_by_role("button", name="Elements", exact=True).click()
            page.get_by_role("searchbox").fill("118")
            page.get_by_role("button", name="Atomic number 118").click()
            expect(page.locator("#detail-title")).to_have_text("Atomic number 118")
            layout(page, width)

            visit(page, base, BOOKS + "book-01.html", width)
            expect(page.get_by_role("heading", level=1)).to_have_text("The Ford Stone")
            if width == 1280:
                page.emulate_media(media="print")
                expect(page.locator(".reader article")).to_be_visible()
                expect(page.locator(".book-nav")).to_be_hidden()
                page.emulate_media(media="screen")

            visit(page, base, STANDALONE, width)
            expect(page.get_by_role("link", name="Open Original Full Page")).to_be_visible()
            layout(page, width)
            visit(page, base, STUDIO, width)
            page.get_by_role("button", name="Mobile", exact=True).click()
            expect(page.locator("#preview")).to_have_class(re.compile(r"\bmobile\b"))
            layout(page, width)
            assert not errors, errors
        context.close()
        print(f"Passed {width}×{height}: catalog, touch/keyboard game, bridge, world, book, standalone, and studio.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromium", help="Path to an installed Chromium executable")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    catalog = json.loads((root / HUB.lstrip("/") / "apps.json").read_text())
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(PreviewHandler, directory=root)) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(executable_path=args.chromium, args=["--no-sandbox"])
                try:
                    verify(browser, f"http://127.0.0.1:{server.server_port}{PREFIX}", catalog["count"])
                finally:
                    browser.close()
        finally:
            server.shutdown()
            thread.join()


if __name__ == "__main__":
    main()

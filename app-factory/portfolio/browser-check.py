"""Check catalog interactions, layout, imagery and progressive motion in Chromium."""
import argparse
import os
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


def check(url, screenshot=None):
    with sync_playwright() as browser_runtime:
        chromium = browser_runtime.chromium.launch(
            executable_path=os.environ.get("PORTFOLIO_CHROMIUM"),
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        try:
            for width in (320, 390, 1440):
                with chromium.new_context(
                    viewport={"width": width, "height": 900},
                    is_mobile=width < 500, has_touch=width < 500,
                    reduced_motion="reduce" if width < 500 else "no-preference",
                ) as context:
                    page = context.new_page()
                    errors = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    assert page.goto(url, wait_until="domcontentloaded").ok
                    expect(page.locator("#featured-grid h3")).to_have_text(["Bible Topia", "Tabor World", "Grapple It"])
                    expect(page.locator("#catalog-results article")).to_have_count(24)
                    expect(page.locator("#catalog-count")).to_contain_text("entries")
                    expect(page.locator("#progress-list")).to_contain_text("Bible Topia, Tabor World and arcade")
                    page.wait_for_function("document.querySelector('.hero img').naturalWidth > 0")
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                    animation = page.locator(".hero-copy").evaluate("(node) => getComputedStyle(node).animationName")
                    assert animation == ("none" if width < 500 else "enter")
                    if screenshot and width == 390:
                        page.screenshot(path=screenshot)
                    page.get_by_role("button", name="Show more apps").click()
                    expect(page.locator("#catalog-results article")).to_have_count(48)
                    page.locator("#state").select_option("hosted")
                    expect(page.locator("#catalog-results article")).to_have_count(12)
                    page.locator("#kind").select_option("Games")
                    expect(page.locator("#catalog-results")).to_contain_text("Grapple It")
                    page.get_by_label("Search apps").fill("grapple")
                    expect(page.locator("#catalog-count")).to_have_text("1 entry")
                    expect(page.locator("#catalog-results a")).to_have_attribute("href", "https://grapple-it.nathantaboract.workers.dev/")
                    page.get_by_label("Search apps").fill("no-matching-test-app")
                    expect(page.locator("#catalog-results")).to_contain_text("No apps match")
                    assert not errors, errors
        finally:
            chromium.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url")
    parser.add_argument("--screenshot", type=Path)
    args = parser.parse_args()
    check(args.url, args.screenshot)
    print("Portfolio passed search, categories, pagination, image, progress, and reflow at 320, 390 and 1440 px.")

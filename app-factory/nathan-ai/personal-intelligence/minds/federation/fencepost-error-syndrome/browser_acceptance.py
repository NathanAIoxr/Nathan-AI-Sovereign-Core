#!/usr/bin/env python3
"""Optional real-browser acceptance: disposable local server and database."""
import argparse
import json
from pathlib import Path
import select
import sqlite3
import subprocess
import sys
import tempfile
import time

from playwright.sync_api import sync_playwright, expect


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--screenshot", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--chromium", help="optional installed Chromium executable")
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    with tempfile.TemporaryDirectory() as temporary:
        process = subprocess.Popen([sys.executable, str(here / "boundary_api.py"), "--db",
                                    str(Path(temporary) / "browser-demo.sqlite3"), "--port", "0"],
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            if not select.select([process.stdout], [], [], 10)[0]:
                raise RuntimeError("reference server did not start")
            line = process.stdout.readline().strip()
            if not line.startswith("Local reference API: "):
                raise RuntimeError("unexpected server startup")
            base = line.removeprefix("Local reference API: ")
            with sync_playwright() as playwright:
                options = {"headless": True}
                if args.chromium: options["executable_path"] = args.chromium
                with playwright.chromium.launch(**options) as browser:
                    page = browser.new_page(viewport={"width": 1280, "height": 1000}, device_scale_factor=1)
                    errors = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.goto(base)
                    expect(page.locator("#health")).to_contain_text("Healthy")
                    page.get_by_label("Check-in", exact=True).fill("2026-11-17")
                    page.get_by_label("Checkout", exact=True).fill("2026-11-19")
                    page.get_by_role("button", name="Create reservation", exact=True).click()
                    expect(page.locator("#status")).to_contain_text("verified and committed")
                    expect(page.locator("#records li")).to_have_count(1)
                    page.get_by_label("Check-in", exact=True).fill("2026-11-19")
                    page.get_by_label("Checkout", exact=True).fill("2026-11-20")
                    page.get_by_role("button", name="Create reservation", exact=True).click()
                    expect(page.locator("#records li")).to_have_count(2)
                    page.get_by_label("Check-in", exact=True).fill("2026-11-18")
                    page.get_by_role("button", name="Create reservation", exact=True).click()
                    expect(page.locator("#status")).to_contain_text("Command rejected")
                    expect(page.locator("#records li")).to_have_count(2)
                    # Commit on server, lose response, then repeat same command.
                    def lose_response(route):
                        route.fetch()
                        route.abort()
                    page.route("**/bookings", lose_response, times=1)
                    page.get_by_label("Check-in", exact=True).fill("2026-11-20")
                    page.get_by_label("Checkout", exact=True).fill("2026-11-21")
                    page.get_by_role("button", name="Create reservation", exact=True).click()
                    expect(page.locator("#retry")).to_be_visible()
                    page.get_by_role("button", name="Retry the same command").click()
                    expect(page.locator("#status")).to_contain_text("verified and committed")
                    expect(page.locator("#records li")).to_have_count(3)
                    self_health = page.request.get(base + "/health").json()
                    assert self_health == {"healthy": True, "bookings": 3, "events": 3}, self_health
                    with sqlite3.connect(str(Path(temporary) / "browser-demo.sqlite3")) as db:
                        db.execute("UPDATE sb_projection SET value=777 WHERE id=1")
                        db.commit()
                        deadline = time.monotonic() + 5
                        while time.monotonic() < deadline:
                            if db.execute("SELECT value FROM sb_projection").fetchone()[0] == 3:
                                break
                            time.sleep(0.05)
                        else:
                            raise AssertionError("background health loop did not repair projection")
                    metrics = page.request.get(base + "/metrics").json()
                    assert metrics["recovery"]["recovery_ok"] == 1, metrics
                    assert errors == [], errors
                    args.screenshot.parent.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(args.screenshot), full_page=True)
                    page.set_viewport_size({"width": 390, "height": 844})
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "mobile horizontal overflow"
                    report = {"passed": True, "checks": ["browser startup", "adjacent reservations", "overlap rejection",
                        "lost response after commit", "idempotent retry", "event conservation", "automatic projection rebuild", "no JS exceptions", "mobile layout"],
                        "health": self_health, "browser": browser.version}
                    args.report.parent.mkdir(parents=True, exist_ok=True)
                    args.report.write_text(json.dumps(report, indent=2) + "\n")
                    print(json.dumps(report))
        finally:
            process.terminate()
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


if __name__ == "__main__": main()

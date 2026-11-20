#!/usr/bin/env python3
"""Capture publicly listed chess variant metadata and prepare additive D1 imports.
Source catalog is a discovery index, not proof that rules are complete or freely licensed.
Usage: pip install playwright && playwright install chromium
       python scripts/chess_variants_import.py --output-dir data/chess-import
       wrangler d1 execute tabor_academy_db --remote --file=data/chess-import/import.sql
"""
import argparse
import hashlib
import json
import pathlib
import re
from playwright.sync_api import sync_playwright

URL = "https://www.chessvariants.tv/"
CREATE = """CREATE TABLE IF NOT EXISTS chess_variant_imports (
 import_id TEXT PRIMARY KEY, title TEXT NOT NULL, source_url TEXT NOT NULL,
 source_catalog TEXT NOT NULL, rules_status TEXT NOT NULL,
 imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
"""
def quote(s):
    return "'" + s.replace("'", "''") + "'"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="data/chess-import")
    parser.add_argument("--max-variants", type=int, default=7000)
    args = parser.parse_args()
    dest = pathlib.Path(args.output_dir)
    dest.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=60000)
        page.locator(".variant-card").first.wait_for(timeout=30000)
        last = -1
        for _ in range(300):
            count = page.locator(".variant-card").count()
            if count >= args.max_variants or count == last:
                break
            last = count
            button = page.locator("#load-more-btn")
            if not button.is_visible():
                break
            button.click()
            page.wait_for_timeout(150)
        records = page.locator(".variant-card").evaluate_all("""cards => cards.map(c => ({
          title: c.querySelector('.variant-name')?.textContent?.trim() || '',
          description: c.querySelector('.variant-description')?.textContent?.trim() || '',
          source_url: c.querySelector('.variant-link')?.href || '',
          board: c.querySelector('.variant-meta')?.textContent?.trim() || ''
        }))""")
        browser.close()
    seen = set()
    result = []
    for record in records:
        name, url = record["title"], record["source_url"]
        if not name or not url.startswith("https://www.chessvariants.com/"):
            continue
        key = (name.casefold(), url)
        if key in seen:
            continue
        seen.add(key)
        record["import_id"] = "cvtv-" + hashlib.sha256((name+"\0"+url).encode()).hexdigest()[:20]
        record["source_catalog"] = URL
        record["rules_status"] = "unverified_rules"
        result.append(record)
    with (dest/"variants.jsonl").open("w", encoding="utf-8") as f:
        for record in result:
            f.write(json.dumps(record, ensure_ascii=False)+"\n")
    sql = [CREATE]
    for i in range(0, len(result), 100):
        batch = result[i:i+100]
        values = ",\n".join("(" + ",".join(map(quote, [
            r["import_id"],r["title"],r["source_url"],"chessvariants.tv","unverified_rules"
        ])) + ")" for r in batch)
        sql.append("INSERT OR IGNORE INTO chess_variant_imports(import_id,title,source_url,source_catalog,rules_status) VALUES\n"+values+";")
    (dest/"import.sql").write_text("\n".join(sql), encoding="utf-8")
    print(json.dumps({"collected":len(records),"unique_source_entries":len(result),"output_dir":str(dest)}))
if __name__ == "__main__":
    main()

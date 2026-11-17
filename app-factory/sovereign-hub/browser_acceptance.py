#!/usr/bin/env python3
"""Actual Chromium acceptance for the permissioned PWA and offline outbox."""
import argparse
import json
import os
from pathlib import Path
import secrets
import select
import subprocess
import sys
import tempfile
from playwright.sync_api import sync_playwright, expect


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--chromium')
    parser.add_argument('--screenshot',type=Path,required=True)
    parser.add_argument('--report',type=Path,required=True)
    args=parser.parse_args()
    here=Path(__file__).resolve().parent
    with tempfile.TemporaryDirectory() as temp:
        token=secrets.token_urlsafe(48)
        env={**os.environ,'ONE_HUB_OWNER_TOKEN':token}
        process=subprocess.Popen([sys.executable,str(here/'server.py'),'--db',str(Path(temp)/'hub.sqlite3'),'--port','0'],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        try:
            if not select.select([process.stdout],[],[],10)[0]: raise RuntimeError('Hub failed to start')
            line=process.stdout.readline().strip()
            if not line.startswith('ONE Sovereign Hub: '): raise RuntimeError('Unexpected startup')
            base=line.removeprefix('ONE Sovereign Hub: ')
            with sync_playwright() as p:
                options={'headless':True}
                if args.chromium: options['executable_path']=args.chromium
                with p.chromium.launch(**options) as browser:
                    context=browser.new_context(viewport={'width':1440,'height':1000})
                    page=context.new_page(); errors=[]
                    page.on('pageerror',lambda error:errors.append(str(error)))
                    page.goto(base)
                    page.locator('#login input').fill(token)
                    page.get_by_role('button',name='Unlock local hub').click()
                    expect(page.locator('#status')).to_contain_text('Owner workspace ready')
                    connector=page.locator('#connector-form')
                    connector.locator('[name=connector]').fill('personal-notes')
                    connector.get_by_role('button',name='Register connector').click()
                    expect(page.locator('#connectors')).to_contain_text('personal-notes')
                    page.locator('#budget').get_by_role('button').click()
                    expect(page.locator('#budget-output')).to_contain_text('334')
                    context_form=page.locator('#context-form')
                    context_form.get_by_role('button',name='Save context').click()
                    expect(page.locator('#context-output')).to_contain_text('"version": 1')
                    queue=page.locator('#queue-form')
                    queue.get_by_role('button').click()
                    expect(page.locator('#outbox li')).to_have_count(1)
                    page.wait_for_function('navigator.serviceWorker.controller !== null')
                    context.set_offline(True)
                    queue.locator('[name=record]').fill('note-two')
                    queue.get_by_role('button').click()
                    expect(page.locator('#outbox li')).to_have_count(2)
                    page.locator('#budget [name=amount]').fill('1001')
                    page.locator('#budget').get_by_role('button').click()
                    expect(page.locator('#budget-output')).to_contain_text('offline integer calculation')
                    context.set_offline(False)
                    page.get_by_role('button',name='Sync pending edits').click()
                    expect(page.locator('#outbox li')).to_have_count(0)
                    queue.locator('[name=record]').fill('note-one')
                    queue.get_by_role('button').click()
                    page.get_by_role('button',name='Sync pending edits').click()
                    expect(page.locator('#outbox')).to_contain_text('conflict')
                    page.get_by_role('button',name='Keep remote',exact=True).click()
                    expect(page.locator('#outbox li')).to_have_count(0)
                    private_cached=page.evaluate("""async () => {
                        for (const key of await caches.keys()) {
                            const cache = await caches.open(key);
                            for (const request of await cache.keys()) {
                                if (new URL(request.url).pathname.startsWith('/api/')) return true;
                            }
                        }
                        return false;
                    }""")
                    assert not private_cached,'Authenticated API data leaked into service-worker cache'
                    page.get_by_role('button',name='Refresh diagnostics').click()
                    expect(page.locator('#status')).to_contain_text('0 sync conflicts')
                    args.screenshot.parent.mkdir(parents=True,exist_ok=True)
                    page.screenshot(path=str(args.screenshot),full_page=True)
                    page.set_viewport_size({'width':390,'height':844})
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'mobile overflow'
                    context.set_offline(True)
                    page.reload()
                    expect(page.get_by_role('heading',name='Your apps. Your control.')).to_be_visible()
                    page.locator('#budget').get_by_role('button').click()
                    expect(page.locator('#budget-output')).to_contain_text('334')
                    context.set_offline(False)
                    assert not errors,errors
                    report={'passed':True,'browser':browser.version,'checks':['owner unlock','local connector registration','exact budget','context version write','offline queue','offline computation','idempotent sync','conflict preservation and owner resolution','no private API cache','offline reload','mobile layout','no JS exceptions']}
                    args.report.parent.mkdir(parents=True,exist_ok=True)
                    args.report.write_text(json.dumps(report,indent=2)+'\n')
                    print(json.dumps(report))
        finally:
            process.terminate()
            try:process.wait(timeout=5)
            except subprocess.TimeoutExpired:process.kill();process.wait(timeout=5)


if __name__=='__main__':main()

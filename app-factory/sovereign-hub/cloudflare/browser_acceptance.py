#!/usr/bin/env python3
"""Owner UI acceptance against a disposable local Workers/DO/D1 runtime."""
import argparse,json,select,subprocess,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--chromium');parser.add_argument('--report',required=True,type=Path);parser.add_argument('--screenshot',required=True,type=Path);args=parser.parse_args()
 here=Path(__file__).resolve().parent;catalog_count=json.loads((here/'public/apps.json').read_text())['count']
 proc=subprocess.Popen(['node',str(here/'runtime-fixture.mjs'),'--serve'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,cwd=here)
 try:
  if not select.select([proc.stdout],[],[],20)[0]:raise RuntimeError('Local Workers fixture failed to start')
  fixture=json.loads(proc.stdout.readline())
  with sync_playwright() as p:
   options={'headless':True}
   if args.chromium:options['executable_path']=args.chromium
   with p.chromium.launch(**options) as browser:
    context=browser.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(fixture['url']);page.locator('#login input').fill(fixture['setup']);page.get_by_role('button',name='Pair this device',exact=True).click();expect(page.locator('#status')).to_contain_text('Owner workspace ready')
    page.locator('#connector-form [name=connector]').fill('notes');page.locator('#connector-form button').click();expect(page.locator('#connectors')).to_contain_text('notes')
    page.locator('#context-form button[type=submit],#context-form button:not([type])').first.click();expect(page.locator('#context-output')).to_contain_text('"version": 1')
    page.locator('#queue-form [name=connector]').fill('notes');page.locator('#queue-form button').click();expect(page.locator('#outbox li')).to_have_count(1)
    page.wait_for_function('navigator.serviceWorker.controller!==null');context.set_offline(True);page.locator('#budget button').click();expect(page.locator('#budget-output')).to_contain_text('offline integer calculation');context.set_offline(False)
    page.get_by_role('button',name='Sync pending edits',exact=True).click();expect(page.locator('#outbox li')).to_have_count(0)
    page.locator('#cloud-booking [name=start]').fill('2026-11-17');page.locator('#cloud-booking [name=end]').fill('2026-11-19');page.locator('#cloud-booking button').click();expect(page.locator('#booking-result')).to_contain_text('personal-room')
    page.reload();expect(page.locator('#status')).to_contain_text('Owner workspace ready')
    page.get_by_role('button',name='Run verified recovery workflow',exact=True).click();expect(page.locator('#cloud-result')).to_contain_text('started')
    page.goto(fixture['url']+'apps.html');expect(page.locator('#count')).to_contain_text(str(catalog_count));page.get_by_label('Find an app').fill('sovereign');expect(page.locator('#apps')).to_contain_text('Sovereign')
    page.goto(fixture['url']);expect(page.locator('#status')).to_contain_text('Owner workspace ready');args.screenshot.parent.mkdir(parents=True,exist_ok=True);page.screenshot(path=str(args.screenshot),full_page=True)
    page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Mobile overflow'
    assert not errors,errors
    report={'passed':True,'scope':'disposable local Workers runtime; no production owner pairing','checks':['nonextractable owner device pairing','signed UI requests','context write','offline outbox','offline exact budget','sync flush','booking','persisted device unlock','recovery workflow','public app catalog','mobile layout','no JS errors']}
    args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
 finally:
  proc.terminate()
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=5)
if __name__=='__main__':main()

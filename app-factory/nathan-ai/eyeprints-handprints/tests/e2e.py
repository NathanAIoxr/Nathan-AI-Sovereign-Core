from playwright.sync_api import sync_playwright
from pathlib import Path
import json, time
root=Path(__file__).resolve().parents[1]
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 context=b.new_context(viewport={"width":390,"height":844},accept_downloads=True)
 page=context.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8765/index.html',wait_until='networkidle')
 page.screenshot(path=str(root/'tests'/'login-mobile.png'),full_page=True)
 assert page.locator('#entry-create').is_visible(), 'create vault not visible'
 page.fill('#newPass','a long local test passphrase 2026')
 page.fill('#confirmPass','a long local test passphrase 2026')
 page.click('#createVault')
 page.locator('#shell').wait_for(state='visible')
 results.append('encrypted vault creation')
 page.click('#menuBtn');page.locator('[data-page="profiles"]').click()
 page.locator('#addProfile').click()
 page.locator('#form_name').fill('Nathan Tabor')
 page.locator('#form_relationship').select_option('self')
 page.locator('#modalForm [type="submit"]').click()
 page.get_by_text('Nathan Tabor',exact=True).first.wait_for()
 results.append('profile creation')
 page.locator('#menuBtn').click();page.locator('[data-page="scan"]').click()
 page.locator('#loadOriginals').click()
 page.wait_for_function("document.querySelector('#statHands').textContent === '2'",timeout=25000)
 results.append('import both hand photos + RGB metrics')
 page.screenshot(path=str(root/'tests'/'scan-mobile.png'),full_page=True)
 # Annotation: press, fill dialog and save.
 page.locator('#addHandMarker').click()
 page.once('dialog',lambda d:d.accept('Visible dorsal skin fold'))
 page.locator('#handCanvas').click(position={'x':125,'y':200})
 page.locator('#saveScan').click()
 page.wait_for_function("document.querySelector('#statHands').textContent === '3'",timeout=15000)
 results.append('manual annotation + encrypted hand scan')
 page.locator('#menuBtn').click();page.locator('[data-page="ledger"]').click()
 page.locator('#addLedger').click()
 page.locator('#form_description').fill('Family testimony and life-history observation')
 page.locator('#form_source').fill('Personal interview')
 page.locator('#modalForm [type="submit"]').click()
 page.get_by_text('Family testimony and life-history observation').wait_for()
 results.append('sourced life-ledger save')
 page.locator('#menuBtn').click();page.locator('[data-page="compare"]').click()
 page.select_option('#compareA',index=1)
 page.select_option('#compareB',index=2)
 page.locator('#compareNow').click()
 assert page.locator('.comparison-images img').count()==2
 results.append('scan comparison')
 page.locator('#menuBtn').click();page.locator('[data-page="vault"]').click()
 with page.expect_download() as dl:
  page.locator('#backupVault').click()
 download=dl.value
 assert download.suggested_filename.endswith('.json')
 backup=root/'tests'/'test-backup.json';download.save_as(backup)
 obj=json.loads(backup.read_text())
 assert obj['format']=='EYEPRINTS_HANDPRINTS_ENCRYPTED_BACKUP'
 assert 'Nathan Tabor' not in backup.read_text()
 assert 'IMG_5083.jpeg' not in backup.read_text()
 results.append('encrypted backup without plaintext data')
 page.locator('#lockBtn').click()
 assert page.locator('#entry-unlock').is_visible()
 page.fill('#unlockPass','a long local test passphrase 2026')
 page.locator('#unlockVault').click()
 page.locator('#shell').wait_for(state='visible')
 assert page.locator('#statHands').text_content()=='3'
 results.append('lock/unlock persistence')
 page.locator('#quickScan').click()
 page.screenshot(path=str(root/'tests'/'final-mobile.png'),full_page=True)
 assert not errors,errors
 print(json.dumps({'passed':results,'javascript_errors':errors,'photos_loaded':page.locator('#statHands').text_content()},indent=2))
 context.close();b.close()

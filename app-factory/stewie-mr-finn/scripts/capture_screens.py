#!/usr/bin/env python3
"""Build-only QA: render actual SwiftUI screens on compact and large iPhones."""
import json, subprocess, time
from pathlib import Path

def run(*args):
    return subprocess.check_output(args, text=True).strip()

def call(*args):
    subprocess.run(args, check=True)

catalog=json.loads(run('xcrun','simctl','list','devices','available','-j'))
devices=[v for group in catalog['devices'].values() for v in group if v['name'].startswith('iPhone')]
assert devices, 'No available iPhone simulators'
compact=next((d for d in devices if 'SE' in d['name']), None) or next((d for d in devices if 'Pro' not in d['name'] and 'Plus' not in d['name'] and 'Air' not in d['name']), devices[0])
large=next((d for d in devices if 'Pro Max' in d['name']), devices[-1])
app='simulator-build/Build/Products/Debug-iphonesimulator/StewieAndMrFinn.app'
screens=['home','map','board','polar','chapter1','workshop','reunion','lab','playroom','stories','explore','puzzle','biscuits','trust','champ','ace','middlec','mirror','family','settings']
for label,device in [('compact',compact),('large',large)]:
    uid=device['udid']
    subprocess.run(['xcrun','simctl','boot',uid], check=False)
    call('xcrun','simctl','bootstatus',uid,'-b')
    call('xcrun','simctl','status_bar',uid,'override','--time','9:41','--dataNetwork','wifi','--wifiMode','active','--wifiBars','3','--batteryState','charged','--batteryLevel','100')
    call('xcrun','simctl','install',uid,app)
    folder=Path('dist/visual-qa')/label
    folder.mkdir(parents=True,exist_ok=True)
    (folder/'device.txt').write_text(device['name'])
    for screen in screens:
        call('xcrun','simctl','launch','--terminate-running-process',uid,'com.nathantabor.stewieandfinn','--qa-screen',screen)
        time.sleep(2)
        call('xcrun','simctl','io',uid,'screenshot',str(folder/(screen+'.png')))
    for screen in ['home','polar','playroom','settings']:
        call('xcrun','simctl','launch','--terminate-running-process',uid,'com.nathantabor.stewieandfinn','--qa-screen',screen,'--qa-large-text')
        time.sleep(2)
        call('xcrun','simctl','io',uid,'screenshot',str(folder/(screen+'-large-text.png')))
    call('xcrun','simctl','shutdown',uid)
print('Captured 48 actual simulator screens; review pixels before delivering.')

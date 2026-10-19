#!/usr/bin/env python3
"""Build-only QA: render actual SwiftUI screens on compact and large iPhones."""
import json, subprocess, time
from pathlib import Path

def run(*args):
    return subprocess.check_output(args, text=True, timeout=120).strip()

def call(*args):
    subprocess.run(args, check=True, timeout=300 if ('bootstatus' in args or 'launch' in args) else 120)

catalog=json.loads(run('xcrun','simctl','list','devices','available','-j'))
groups=[(key,group) for key,group in catalog['devices'].items()
        if key.startswith('com.apple.CoreSimulator.SimRuntime.iOS-') and any(d['name'].startswith('iPhone') for d in group)]
groups.sort(key=lambda pair: tuple(int(v) for v in pair[0].split('.iOS-')[1].split('-')))
assert groups, 'No available iOS simulator runtime'
runtime_id,group=groups[-1]
devices=[v for v in group if v['name'].startswith('iPhone')]
assert devices, 'No available iPhone simulators'
compact=next((d for d in devices if 'SE' in d['name']), None) or next((d for d in devices if 'Pro' not in d['name'] and 'Plus' not in d['name'] and 'Air' not in d['name']), devices[0])
large=next((d for d in devices if 'Pro Max' in d['name']), devices[-1])
# Create a genuine 375-point compact device when the runner only precreates new models.
if 'SE' not in compact['name']:
    try:
        uid=run('xcrun','simctl','create','Stewart Finn Compact QA','com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation',runtime_id)
        compact={'name':'iPhone SE (3rd generation)','udid':uid}
    except subprocess.CalledProcessError:
        print('SE simulator unavailable; using smallest precreated iPhone:', compact['name'])
app='simulator-build/Build/Products/Debug-iphonesimulator/StewieAndMrFinn.app'
screens=['quick-games','story-shelf','create-shelf','word-shelf','home','unified','map','board','polar','chapter1','workshop','reunion','lab','playroom','stories','explore','puzzle','biscuits','trust','champ','ace','middlec','mirror','family','settings']
for label,device in [('compact',compact),('large',large)]:
    uid=device['udid']
    subprocess.run(['xcrun','simctl','boot',uid], check=False)
    call('xcrun','simctl','bootstatus',uid,'-b')
    call('xcrun','simctl','status_bar',uid,'override','--time','9:41','--dataNetwork','wifi','--wifiMode','active','--wifiBars','3','--batteryState','charged','--batteryLevel','100')
    call('xcrun','simctl','install',uid,app)
    data=Path(run('xcrun','simctl','get_app_container',uid,'com.nathantabor.stewieandfinn','data'))
    ready=data/'tmp'/'qa-web-ready.txt'
    folder=Path('dist/visual-qa')/label
    folder.mkdir(parents=True,exist_ok=True)
    (folder/'device.txt').write_text(device['name']+'\n'+runtime_id)
    for screen in screens:
        if screen in ['middlec','mirror']: ready.unlink(missing_ok=True)
        call('xcrun','simctl','launch','--terminate-running-process',uid,'com.nathantabor.stewieandfinn','--qa-screen',screen)
        if screen in ['middlec','mirror']:
            deadline=time.monotonic()+60
            while not ready.exists() and time.monotonic()<deadline: time.sleep(.25)
            assert ready.exists(), 'Web puzzle did not finish loading: '+screen
            assert ready.read_text()=='ready', ready.read_text()
            time.sleep(1)
        else: time.sleep(2)
        call('xcrun','simctl','io',uid,'screenshot',str(folder/(screen+'.png')))
    for screen in ['trust','chapter1','lab']:
        call('xcrun','simctl','launch','--terminate-running-process',uid,'com.nathantabor.stewieandfinn','--qa-screen',screen,'--qa-wrong')
        time.sleep(2)
        call('xcrun','simctl','io',uid,'screenshot',str(folder/(screen+'-feedback.png')))
    for screen in ['home','unified','polar','playroom','settings']:
        call('xcrun','simctl','launch','--terminate-running-process',uid,'com.nathantabor.stewieandfinn','--qa-screen',screen,'--qa-large-text')
        time.sleep(2)
        call('xcrun','simctl','io',uid,'screenshot',str(folder/(screen+'-large-text.png')))
    for target,large_text in [('partners',False),('polar',False),('activities',False),('partners',True),('activities',True)]:
        args=['xcrun','simctl','launch','--terminate-running-process',uid,'com.nathantabor.stewieandfinn','--qa-screen','home','--qa-scroll',target]
        if large_text: args.append('--qa-large-text')
        call(*args)
        time.sleep(2)
        suffix='-large-text' if large_text else ''
        call('xcrun','simctl','io',uid,'screenshot',str(folder/('home-'+target+suffix+'.png')))
    call('xcrun','simctl','shutdown',uid)
print('Captured 76 actual simulator screens, including scrolled home sections; review pixels before delivering.')
